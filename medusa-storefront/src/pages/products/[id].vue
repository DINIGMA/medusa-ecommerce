<template>
  <v-container class="py-12 px-7">
    <v-row>
      <!-- Левая часть: изображение товара -->
      <v-col cols="12" md="6">
        <v-img
          :src="currentProduct?.images[0].url"
          height="400"
          contain
        ></v-img>
      </v-col>

      <!-- Правая часть: информация о товаре -->
      <v-col cols="12" md="6">
        <v-card class="pa-5" v-if="currentProduct">
          <v-card-title class="text-h5">{{
            currentProduct?.title
          }}</v-card-title>
          <v-card-subtitle class="text-grey">{{
            currentProduct?.category
          }}</v-card-subtitle>
          <v-card-subtitle class="">Description</v-card-subtitle>
          <v-card-text>{{ currentProduct?.description }}</v-card-text>

          <div style="display: flex; gap: 10px">
            <span class="text-h6 font-weight-bold">200 ₽</span>
            <v-btn color="primary" @click="addToCart(currentProduct)">
              Купить
            </v-btn>
          </div>
        </v-card>
        <v-skeleton-loader
          v-else
          class="mx-auto border"
          type="card"
        ></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- Блок рекомендаций -->
    <v-divider class="my-5"></v-divider>
    <h2 class="text-center mb-5">Схожие товары</h2>
    <v-row v-if="currentRecommendation">
      <v-col
        v-for="rec in currentRecommendation.rec"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="product-card p-10">
          <v-img :src="rec?.product?.thumbnail" height="200" contain></v-img>
          <v-card-title class="text-center">{{
            rec?.product?.title
          }}</v-card-title>
          <v-card-subtitle>{{ rec?.product?.description }}</v-card-subtitle>
          <v-card-actions>
            <v-btn :to="`/products/${rec?.product?.id}`" color="primary"
              >Подробнее</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col v-for="product in 10" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader
          class="mx-auto border"
          type="card"
        ></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-divider class="my-5"></v-divider>
    <h2 class="text-center mb-5">Схожие товары</h2>
    <v-row v-if="currentCollabRec">
      <v-col v-for="rec in currentCollabRec" cols="12" sm="6" md="4" lg="3">
        <v-card class="product-card p-10">
          <v-img :src="rec?.thumbnail" height="200" contain></v-img>
          <v-card-title class="text-center">{{ rec?.title }}</v-card-title>
          <v-card-subtitle>{{ rec?.description }}</v-card-subtitle>
          <v-card-actions>
            <v-btn :to="`/products/${rec?.id}`" color="primary"
              >Подробнее</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col v-for="product in 10" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader
          class="mx-auto border"
          type="card"
        ></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-divider class="my-5"></v-divider>
    <h2 class="text-center mb-5">Гибридная модель</h2>
    <v-row v-if="hybridRec">
      <v-col v-for="rec in hybridRec" cols="12" sm="6" md="4" lg="3">
        <v-card class="product-card p-10">
          <v-img :src="rec?.product?.thumbnail" height="200" contain></v-img>
          <v-card-title class="text-center">{{
            rec?.product?.title
          }}</v-card-title>
          <v-card-subtitle>{{ rec?.product?.description }}</v-card-subtitle>
          <v-card-actions>
            <v-btn :to="`/products/${rec?.product?.id}`" color="primary"
              >Подробнее</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col v-for="product in 10" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader
          class="mx-auto border"
          type="card"
        ></v-skeleton-loader>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import router from "@/router";
import { useRoute } from "vue-router";
import { useProductsStore } from "@/stores/products";
import { useRecommendationStore } from "@/stores/recommendation";
import { storeToRefs } from "pinia";
import defaultImg from "@/assets/images/default-product.png";

definePage({
  meta: {
    props: true,
  },
});

const productStore = useProductsStore();
const recommendationStore = useRecommendationStore();

const { currentProduct, currentRecommendation, currentCollabRec, hybridRec } =
  storeToRefs(productStore);

interface RouteParams {
  id: string;
}

const route = useRoute();
const id = computed(() => {
  return (route.params as RouteParams).id;
});

defineProps({
  id: String,
});

const addToCart = (product: object) => {
  console.log(recommendationStore.getProductForContentRec);
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  recommendationStore.addViewProduct(id.value);
  Promise.all([
    productStore.getProductById(id.value),
    // productStore.getRecommendationForProducts(id.value),
    // productStore.getHybridRecommendation(),
  ]);
});

watch(id, () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  recommendationStore.addViewProduct(id.value);
  Promise.all([
    productStore.getProductById(id.value),
    // productStore.getRecommendationForProducts(id.value),
  ]);
});
</script>

<style></style>
