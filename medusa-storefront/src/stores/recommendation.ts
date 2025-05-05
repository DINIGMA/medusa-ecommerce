import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { baseHttp, storeHttp } from "@/http";
import axios from "axios";

interface ProductViewInfo {
  count: number;
  timestamp: number; // Добавляем временную метку
}

export const useRecommendationStore = defineStore("recommendation", () => {
  const addViewProduct = (id: string) => {
    const storageKey = "viewedProducts";
    const rawData = localStorage.getItem(storageKey);

    // Парсим данные с проверкой типа
    let data: Record<string, ProductViewInfo> = rawData
      ? JSON.parse(rawData)
      : {};

    // Обновляем запись
    if (data[id]) {
      data[id].count += 1;
      data[id].timestamp = Date.now(); // Обновляем время при каждом просмотре
    } else {
      data[id] = {
        count: 1,
        timestamp: Date.now(),
      };
    }

    // Удаляем старые записи если больше 50
    const entries = Object.entries(data);
    if (entries.length > 50) {
      // Сортируем по времени (сначала старые)
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Оставляем последние 50 записей
      const trimmed = sorted.slice(-50);

      data = Object.fromEntries(trimmed);
    }

    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const getProductForContentRec = computed(() => {
    const rawData = localStorage.getItem("viewedProducts");
    if (!rawData) return [];

    const data: Record<string, ProductViewInfo> = JSON.parse(rawData);

    return Object.entries(data)
      .filter(([_, info]) => info.count > 2)
      .map(([id]) => id);
  });

  return {
    addViewProduct,
    getProductForContentRec,
  };
});
