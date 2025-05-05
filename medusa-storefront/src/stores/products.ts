import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { baseHttp, storeHttp } from "@/http";
import axios from "axios";

export const useProductsStore = defineStore("products", () => {
  const products = ref();
  const currentProduct = ref();

  const currentRecommendation = ref();
  const hybridRec = ref();
  const currentCollabRec = ref();

  const categories = ref();
  const currentChildrenCategory = ref();
  const currentCategory = ref();

  const getProductsForCategories = async (
    limits: number | null,
    offset: number | null,
    category_id: string
  ) => {
    const queryParams = new URLSearchParams({
      fields: `*variants.calculated_price`,
      region_id: "reg_01JKB6MR0CTRY11YD3382K5GM1",
      category_id: category_id,
    });

    products.value = null;

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
        customer_id: "cus_01JSPEJ8V5EHV1KEHYN21ZVHSK",
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
  const getHybridRecommendation = async (products_ids: any) => {
    currentRecommendation.value = null;
    currentCollabRec.value = null;
    hybridRec.value = null;
    try {
      const { data } = await storeHttp.post(`/hybridRecommendation`, {
        product_ids: products_ids,
        customer_id: "cus_01JSPEJ8V5EHV1KEHYN21ZVHSK",
      });
      hybridRec.value = data.hybridRecommendations.hybridRec.recommendations;
    } catch (err) {
      console.log(err);
    }
  };

  const getAllCategories = async () => {
    try {
      const queryParams = new URLSearchParams({
        fields: `*category_children`,
        parent_category_id: "null",
      });
      const { data } = await storeHttp.get(
        `/product-categories?${queryParams}&limit=1000`
      );
      categories.value = data.product_categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getCurrentCategories = async (id: string) => {
    const queryParams = new URLSearchParams({
      fields: `name,category_children.id,category_children.name`,
      id: id,
    });
    currentCategory.value = null;
    try {
      const { data } = await storeHttp.get(
        `/product-categories?${queryParams}`
      );
      currentCategory.value = data.product_categories[0];
      currentChildrenCategory.value =
        data.product_categories[0].category_children;
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  return {
    products,
    currentRecommendation,
    currentProduct,
    currentCollabRec,
    hybridRec,
    categories,
    currentCategory,
    currentChildrenCategory,
    getProductsForCategories,
    getProductById,
    getRecommendationForProducts,
    getAllProducts,
    getHybridRecommendation,
    getAllCategories,
    getCurrentCategories,
  };
});
