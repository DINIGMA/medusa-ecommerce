import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { baseHttp, storeHttp } from "@/http";
import axios from "axios";

export const useProductsStore = defineStore("products", () => {
  const products = ref();
  const currentProduct = ref();
  const currentRecommendation = ref();
  const currentCollabRec = ref();

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

  const getAllProducts = async () => {
    try {
      const { data } = await baseHttp.get(`/store/products`);
      console.log(data);
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
    currentCollabRec.value = null;
    try {
      const { data } = await storeHttp.post(`/recommendation/${id}`, {
        product_ids: [
          "prod_01JSC50QFK17TM7ZK9BM1W4RR2",
          "prod_01JSC50QF422FVFZR14KM47543",
        ],
        customer_id: "cus_01JSPEJ8V1NP7WKKB27084T6D2",
      });
      console.log(data);
      const contentRec = data.content_recommendations.recommendation;
      const collabRec =
        data.collaborative_recommendations.collabRec.recommendations;
      currentRecommendation.value = contentRec;
      currentCollabRec.value = collabRec;
    } catch (err) {
      console.log(err);
    }
  };

  return {
    products,
    currentRecommendation,
    currentProduct,
    currentCollabRec,
    getProducts,
    getProductById,
    getRecommendationForProducts,
    getAllProducts,
  };
});
