import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { baseHttp, storeHttp } from "@/http";
import axios from "axios";

export const useProductsStore = defineStore("products", () => {
  const products = ref();
  const currentProduct = ref();
  const currentRecommendation = ref();

  const getProducts = async (limits: number | null, offset: number | null) => {
    const queryParams = new URLSearchParams({
      fields: `*variants.calculated_price`,
      region_id: "reg_01JKB6MR0CTRY11YD3382K5GM1",
    });

    try {
      const { data } = await storeHttp.get(
        `/products?limit=${limits}&${queryParams}&offset=${offset}`
      );
      products.value = data;
    } catch (err) {
      console.log(err);
    }
  };

  const getProductById = async (id: string | undefined) => {
    currentProduct.value = null;
    try {
      const { data } = await storeHttp.get(`/products/${id}`);
      currentProduct.value = data.product;
    } catch (err) {
      console.log(err);
    }
  };

  const getRecommendationForProducts = async (id: string | undefined) => {
    currentRecommendation.value = null;
    try {
      const { data } = await storeHttp.get(`/recommendation/${id}`);
      currentRecommendation.value = data.recommendation;
    } catch (err) {
      console.log(err);
    }
  };

  return {
    products,
    currentRecommendation,
    currentProduct,
    getProducts,
    getProductById,
    getRecommendationForProducts,
  };
});
