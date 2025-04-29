import json
import gzip
import pandas as pd
from itertools import islice
import re
import requests
import base64
import uuid
import numpy as np
import csv


# получение и сопоставление основной категорий для импорта продуктов
headers = {
    "Content-Type": "application/json",
    "x-publishable-api-key": "pk_3271980a7c842fcc02d847eda45820e332f2005cab1e394dad1918356934cd7a",
}

response = requests.get("http://localhost:9000/store/product-categories", headers=headers)
categories_data = response.json().get('product_categories', [])

category_id_map = {cat['name']: cat['id'] for cat in categories_data}



# Ключи и юрл для запросов
API_KEY = "sk_fe8d44b9bdf84d43ab8600ac1abb454ce2d61beede43ce7bb143427a12ece481"
credentials = base64.b64encode(f"{API_KEY}:".encode()).decode()
BASE_URL = "http://localhost:9000/admin/product-categories"

# Заголовки для админа
Headers = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/json"
}

response = requests.get(
        BASE_URL,
        headers=Headers
)

print(response.json())


# получаем тестовые данные продуктов
file = r"D:\Downloads\meta_Electronics.jsonl.gz"

with gzip.open(file, "rt", encoding="utf-8") as fp:
    # первые 50000 строк
    data = [json.loads(line.strip()) for line in islice(fp, 50000)]

df = pd.DataFrame(data)


df.to_csv('exampleAmazon1.csv', index=False, sep=";", quoting=csv.QUOTE_ALL, escapechar="\\")


def clean_handle(title):
    title = title.lower()  
    title = re.sub(r"[^a-z0-9]+", " ", title)
    title = title.strip().replace(" ", "-")
    return title


print(f"Всего записей: {len(df)}")
print(df.head())
print(df.info())
print(df.iloc[1]["title"])
print(df.iloc[1]["categories"])


categories = df['main_category'].unique()

print(categories)


def process_options(row):
    details = row.get('details', {})
    
    exclude_keys = ['Best Sellers Rank']
    filtered_details = {k: v for k, v in details.items() if k not in exclude_keys}
    
    sorted_items = sorted(filtered_details.items(), key=lambda x: x[0])
    
    options = {}
    for idx, (key, value) in enumerate(sorted_items[:10], 1):
        
        if str(value).strip() in ("0", "0.0", ""):
            continue
        
        # Гарантируем строковый тип для имени и значения
        options[f'Option {idx} Name'] = str(key).strip().title() if key is not None else ""
        options[f'Option {idx} Value'] = str(value).strip() if value is not None else ""
    
    return pd.Series(options)




template_columns = [
    'Product Id', 'Product Handle', 'Product Title', 'Product Subtitle', 'Product Description',
    'Product Status', 'Product Thumbnail', 'Product Weight', 'Product Length', 'Product Width',
    'Product Height', 'Product HS Code', 'Product Origin Country', 'Product MID Code', 'Product Material',
    'Product Collection Title', 'Product Collection Handle', 'Product Type','Product Category 1', 'Product Tags', 'Product Discountable',
    'Product External Id', 'Product Profile Name', 'Product Sales Channel 1', 'Product Profile Type', 'Variant Id', 'Variant Title',
    'Variant SKU', 'Variant Barcode', 'Variant Inventory Quantity', 'Variant Allow Backorder', 'Variant Manage Inventory',
    'Variant Weight', 'Variant Length', 'Variant Width', 'Variant Height', 'Variant HS Code', 'Variant Origin Country',
    'Variant MID Code', 'Variant Material', 'Price EUR', 'Price USD',
    'Option 1 Name', 'Option 1 Value',
    'Option 2 Name', 'Option 2 Value',
    'Option 3 Name', 'Option 3 Value',
    'Option 4 Name', 'Option 4 Value',
    'Option 5 Name', 'Option 5 Value',
    'Option 6 Name', 'Option 6 Value',
    'Option 7 Name', 'Option 7 Value',
    'Option 8 Name', 'Option 8 Value',
    'Option 9 Name', 'Option 9 Value',
    'Option 10 Name', 'Option 10 Value',
    'Image 1 Url', 'Image 2 Url'
]



new_df = pd.DataFrame(columns = template_columns)



# Создаем новый датасет для импорта

new_df['Product Title'] = df['title']
new_df['Product Handle'] = df['title'].apply(clean_handle)
new_df['Product Description'] = df['description'].apply(
    lambda x: ' '.join(map(str, x)) if isinstance(x, list) else str(x)
)
new_df['Product Status'] = 'published'
new_df['Product Weight'] = 0  
new_df['Product Length'] = 0
new_df['Product Width'] = 0
new_df['Product Width'] = 0
new_df['Product Category 1'] = df['main_category'].map(category_id_map)
new_df['Product Type'] = 0
new_df['Product External Id'] = df['parent_asin']
new_df['Product Sales Channel 1'] = 'sc_01JKB6MKKAT3YDG9JMFXS0GFR9'
new_df['Variant Title'] = df['title']
new_df['Variant Inventory Quantity'] = 1000


# Обработка опций продукта
'''
new_df = new_df.reindex(columns=template_columns).combine_first(
    df.apply(process_options, axis=1)
)

for i in range(1, 11):
    option_name = f'Option {i} Name'
    option_value = f'Option {i} Value'
    new_df[option_name] = new_df.get(option_name, None)
    new_df[option_value] = new_df.get(option_value, None)

'''


# Обработка массива изобрадений
def process_images(row):
    images = row.get('images', [])
    image_data = {}
    
    # Приоритеты типов изображений
    for idx, img in enumerate(images[:2], 1):
        url = (
            img.get('hi_res') or 
            img.get('large') or 
            img.get('thumb') or 
            ''
        )
        image_data[f'Image {idx} Url'] = url
    
    return pd.Series(image_data)





'''

new_df = new_df.reindex(columns=template_columns).combine_first(
    df.apply(process_options, axis=1)
).combine_first(
    df.apply(process_images, axis=1)
)

for i in range(1, 3):
    col_name = f'Image {i} Url'
    new_df[col_name] = new_df.get(col_name, '').astype(str)


new_df['Option 1 Name'] = 'default name'
new_df['Option 1 Value'] = 'default value'
'''
new_df['Option 1 Name'] = 'default name'
new_df['Option 1 Value'] = 'default value'


processed_options = df.apply(process_options, axis=1).set_index(new_df.index)
processed_images = df.apply(process_images, axis=1).set_index(new_df.index)

new_df = pd.concat(
    [new_df, processed_options, processed_images], 
    axis=1
).groupby(level=0, axis=1).last()

new_df = new_df.reindex(columns=template_columns)

new_df['Variant Inventory Quantity'] = 1000
new_df['Variant Allow Backorder'] = "false"
new_df['Variant Manage Inventory'] = "true"
new_df['Price EUR'] = df['price']
new_df['Price USD'] = df['price']

print(new_df.info())
print(new_df.head())
print(new_df.iloc[9])




#-------------------------------------------------------
print("------------------------------------------------")

created_categories = {}

def create_category_hierarchy(category_path):
    hierarchy = category_path.split(' > ')
    current_parent = None
    full_handle = []  # Для накопления полного пути handle
    
    for i in range(len(hierarchy)):
        current_path = ' > '.join(hierarchy[:i+1])
        current_name = hierarchy[i]
        
        # уникальный handle
        handle_segment = re.sub(r'[^a-z0-9]+', '-', current_name.lower()).strip('-')
        full_handle.append(handle_segment)
        category_handle = '-'.join(full_handle)
        
        # Если категория уже существует пропускаем 
        if current_path in created_categories:
            current_parent = created_categories[current_path]
            continue
            
        # Тело запроса
        payload = {
            "name": current_name,
            "handle": category_handle,
            "parent_category_id": current_parent,
            "is_internal": False,
            "is_active": True
        }
        
        # Отправляем запрос
        try:
            response = requests.post(
                f"{BASE_URL}",
                headers=Headers,
                json=payload
            )
            
            if response.status_code == 200:
                category_id = response.json()['product_category']['id']
                created_categories[current_path] = category_id
                current_parent = category_id
            else:
                if "already exists" in response.text:
                    # если handle же существует добавляет суффикс
                    category_handle += f"-{uuid.uuid4().hex[:4]}"
                    payload['handle'] = category_handle
                    response = requests.post(
                        f"{BASE_URL}",
                        headers=Headers,
                        json=payload
                    )
                    
                if response.status_code != 200:
                    raise Exception(response.text)
                
        except Exception as e:
            print(f"Ошибка при создании категории {current_path}: {str(e)}")
            return None
    
    return current_parent


# Создание иерархии категорий
# Обрабатываем категории для всех продуктов
for index, row in df.iterrows():
    if isinstance(row['categories'], list) and len(row['categories']) > 0:
        # Формируем путь вида "Electronics > Wearable Technology > Clips"
        category_path = ' > '.join(row['categories'])
        
        # Создаем или получаем ID конечной категории
        category_id = create_category_hierarchy(category_path)
        
        # Обновляем маппинг категорий
        if category_id:
            df.at[index, 'main_category_id'] = category_id

# Обновляем маппинг в основном DataFrame
category_id_map = {k.split(' > ')[-1]: v for k, v in created_categories.items()}

full_category_id_map = {k: v for k, v in created_categories.items()}


def get_last_category_id(categories_list):
    if not isinstance(categories_list, list) or len(categories_list) == 0:
        return None
    
    # Формируем полный путь
    category_path = ' > '.join(categories_list)
    
    # Ищем самый длинный подходящий путь
    max_depth = 0
    selected_id = None
    
    for path in full_category_id_map:
        if category_path.startswith(path):
            current_depth = len(path.split(' > '))
            if current_depth > max_depth:
                max_depth = current_depth
                selected_id = full_category_id_map[path]
    
    return selected_id

# 3. Применяем функцию к каждому продукту
df['deepest_category_id'] = df['categories'].apply(get_last_category_id)

# 4. Заполняем столбец в new_df
new_df['Product Category 1'] = df['deepest_category_id']



new_df = new_df.drop_duplicates(
    subset=['Product Title'],
    keep='first'               
)


size = 5000  # Количество строк в одном файле
chunks = np.array_split(new_df, np.ceil(len(new_df)/size))


for i, chunk in enumerate(chunks):
    filename = f'outputAmazon_part_{i+1}.csv'
    chunk.to_csv(filename, index=False, sep=";", escapechar="\\")
    print(f'Создан файл: {filename} с {len(chunk)} строками')

print('Успешно')

    
#new_df.to_csv('outputAmazon1.csv', index=False, sep=";", quoting=csv.QUOTE_ALL, escapechar="\\")



