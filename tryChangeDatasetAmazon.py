import json
import gzip
import pandas as pd
import requests
import base64
from typing import Dict, List
from collections import defaultdict
from itertools import islice
import os
import pickle
from pathlib import Path

# Конфигурация
MEDUSA_BASE_URL = "http://localhost:9000"
API_KEY = "sk_fe8d44b9bdf84d43ab8600ac1abb454ce2d61beede43ce7bb143427a12ece481"
credentials = base64.b64encode(f"{API_KEY}:".encode()).decode()
headers = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/json"
}

headers_store = {
    "Content-Type": "application/json",
    "x-publishable-api-key": "pk_3271980a7c842fcc02d847eda45820e332f2005cab1e394dad1918356934cd7a",
}




# Кэши
product_cache: Dict[str, str] = {}  # {parent_asin: product_id}
user_cache: Dict[str, str] = {}     # {reviewer_id: user_id}



def get_all_medusa_products() -> Dict[str, str]:
    products = {}
    offset = 0
    limit = 10000

    while True:
        response = requests.get(
            f"{MEDUSA_BASE_URL}/admin/products",
            headers=headers,
            params={"offset": offset, "limit": limit, "fields": "id, external_id"}
        )
        data = response.json()

        for product in data.get("products", []):
            parent_asin = product.get("external_id", {})
            if parent_asin:
                products[parent_asin] = product["id"]

        if len(data.get("products", [])) < limit:
            break
        offset += limit

    return products


#limit: int = 100000
'''
def load_reviews(file_path: str) -> List[dict]:
    reviews = []
    with gzip.open(file_path, "rt", encoding="utf-8") as fp:
        for line in fp:
            #if len(reviews) >= limit:
                #break
            review = json.loads(line.strip())
            if review.get("parent_asin") in product_cache and review.get("user_id"):
                reviews.append(review)
    return reviews
'''



def get_cache_path(original_path: str) -> str:
    """Генерирует путь для кэш-файла"""
    path = Path(original_path)
    return str(path.parent / f"{path.stem}.cache.pkl")

#limit: int = 100000

def load_reviews(file_path: str, limit: int = 100000) -> List[dict]:

    '''
    cache_path = get_cache_path(file_path)
    
    # Проверяем существование кэша и дату модификации исходного файла
    if os.path.exists(cache_path):
        file_mtime = os.path.getmtime(file_path)
        cache_mtime = os.path.getmtime(cache_path)
        

        if file_mtime <= cache_mtime:
            try:
                with open(cache_path, 'rb') as f:
                    print(f"Загрузка отзывов из кэша: {cache_path}")
                    cached_data = pickle.load(f)
                    print(f"Загружено {len(cached_data)} отзывов из кэша")
                    return [r for r in cached_data if r.get("parent_asin") in product_cache and r.get("user_id")]
            except Exception as e:
                print(f"Ошибка загрузки кэша: {e}")
    '''
    # Чтение из исходного файла и сохранение в кэш
    print("Чтение исходного файла и создание кэша...")
    reviews = []
    with gzip.open(file_path, "rt", encoding="utf-8") as fp:
        for line in fp:
            #if len(reviews) >= limit:
                #break
            review = json.loads(line.strip())
            if review.get("parent_asin") in product_cache and review.get("user_id"):
                reviews.append(review)
    '''
    # Сохраняем сырые данные в кэш
    try:
        with open(cache_path, 'wb') as f:
            pickle.dump(reviews, f)
        print(f"Кэш сохранен: {cache_path}")
    except Exception as e:
        print(f"Ошибка сохранения кэша: {e}")
    '''
    return [r for r in reviews if r.get("parent_asin") in product_cache and r.get("user_id")]



def batch_create_users(reviewer_ids: List[str], reviews_data: List[dict]) -> Dict[str, str]:
    users_to_create = []
    user_email_map = {}
    unique_ids = set()
    
    for reviewer_id, review in zip(reviewer_ids, reviews_data):
        if reviewer_id in unique_ids:
            continue
        unique_ids.add(reviewer_id)
        
        user_email = f"{reviewer_id}@reviews.example.com"
        users_to_create.append({
            "email": user_email,
            "first_name": review.get("reviewerName", f"User_{reviewer_id[:6]}"),
        })
        user_email_map[user_email] = reviewer_id

    print(users_to_create)

    # Отправляем пакетный запрос
    response = requests.post(
        f"{MEDUSA_BASE_URL}/workflow",
        headers=headers,
        json= users_to_create
    )

    # Обрабатываем ответ
    if response.status_code == 200:
        created_users = response.json()
        id_mapping = {}
        for user in created_users:
            reviewer_id = user_email_map.get(user["email"])
            if reviewer_id:
                id_mapping[reviewer_id] = user["id"]
        return id_mapping
    else:
        print(f"Ошибка создания пользователей: {response.text}")
        return {}


def batch_get_or_create_users(reviewer_ids: List[str], reviews_data: List[dict]) -> Dict[str, str]:
    # Убираем дубликаты на входе
    unique_data = {}
    for rid, review in zip(reviewer_ids, reviews_data):
        if rid not in unique_data:
            unique_data[rid] = review
    
    # Обновляем списки
    unique_ids = list(unique_data.keys())
    unique_reviews = [unique_data[rid] for rid in unique_ids]

    
    missing_users = []
    missing_reviews = []
    id_mapping = {}
    
    for rid, review in zip(reviewer_ids, reviews_data):
        if rid in user_cache:
            id_mapping[rid] = user_cache[rid]
        else:
            missing_users.append(rid)
            missing_reviews.append(review)
    
    
    # Создаем отсутствующих пользователей пачками по 500
    for i in range(0, len(missing_users), 500):
        batch_ids = missing_users[i:i+500]
        batch_reviews = missing_reviews[i:i+500]
        created = batch_create_users(batch_ids, batch_reviews)
        id_mapping.update(created)
        user_cache.update(created)
    
    return id_mapping

def batch_import_reviews(reviews_batch: List[dict]):
    review_data = []
    for review in reviews_batch:
        data = {
            "product_id": product_cache[review["parent_asin"]],
            "customer_id": user_cache[review["user_id"]],
            "first_name": review.get("reviewerName", f"User_{review['user_id'][:6]}"),
            "title": review.get("title", "Без названия")[:255],
            "content": review.get("text", "")[:2000],
            "rating": max(1, min(5, review.get("rating", 5))),
            "status": "approved"
        }
        review_data.append(data)

    response = requests.post(
        f"{MEDUSA_BASE_URL}/store/review",
        headers=headers_store,
        json= review_data
    )

    if response.status_code not in [200, 201]:
        print(f"Ошибка импорта отзывов: {response.text}")


        

product_cache = get_all_medusa_products()
print(f"Загружено {len(product_cache)} товаров")


reviews = load_reviews(r"D:\Downloads\Electronics.jsonl.gz", 4000000)
print(f"Найдено {len(reviews)} отзывов с соответствующими товарами")

# Считаем количество отзывов для каждого пользователя
user_review_counts = {}
for review in reviews:
    user_id = review.get("user_id")
    if user_id:
        user_review_counts[user_id] = user_review_counts.get(user_id, 0) + 1

# Фильтруем отзывы, оставляя только пользователей с более чем 2 отзывами
filtered_reviews = [review for review in reviews if user_review_counts.get(review.get("user_id"), 0) > 2]
print(f"Оставлено {len(filtered_reviews)} отзывов от {len(user_review_counts)} пользователей с более чем 2 отзывами")

# Обновляем список отзывов
reviews = filtered_reviews

# Группировка и пакетная обработка с уникализацией
seen_ids = set()
reviewer_ids = []
user_reviews = []

for review in reviews:
    rid = review.get("user_id")
    if rid and rid not in seen_ids:
        seen_ids.add(rid)
        reviewer_ids.append(rid)
        user_reviews.append(review)



# Пакетное создание пользователей (только тех, у кого >2 отзывов)
user_id_map = batch_get_or_create_users(reviewer_ids, user_reviews)

# Пакетный импорт отзывов
reviews_batch = []
for review in reviews:
    if review.get("user_id") in user_cache and review.get("parent_asin") in product_cache:
        reviews_batch.append(review)
        
    if len(reviews_batch) >= 100:
        batch_import_reviews(reviews_batch)
        reviews_batch = []

if reviews_batch:
    batch_import_reviews(reviews_batch)

print("Импорт завершен!")

'''        

# Модифицированный основной процесс
product_cache = get_all_medusa_products()
print(f"Загружено {len(product_cache)} товаров")

reviews = load_reviews(r"D:\Downloads\Electronics.jsonl.gz", 2000000)
print(f"Найдено {len(reviews)} отзывов с соответствующими товарами")

# Группировка и пакетная обработка с уникализацией
seen_ids = set()
reviewer_ids = []
user_reviews = []

for review in reviews:
    rid = review.get("user_id")
    if rid and rid not in seen_ids:
        seen_ids.add(rid)
        reviewer_ids.append(rid)
        user_reviews.append(review)

# Пакетное создание пользователей
user_id_map = batch_get_or_create_users(reviewer_ids, user_reviews)

# Пакетный импорт отзывов (обрабатываем ВСЕ отзывы)
reviews_batch = []
for review in reviews:
    # Проверяем наличие в кэшах
    if review.get("user_id") in user_cache and review.get("parent_asin") in product_cache:
        reviews_batch.append(review)
        
    if len(reviews_batch) >= 100:
        batch_import_reviews(reviews_batch)
        reviews_batch = []

# Отправляем оставшиеся отзывы
if reviews_batch:
    batch_import_reviews(reviews_batch)

print("Импорт завершен!")

'''


