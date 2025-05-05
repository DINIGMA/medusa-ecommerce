<template>
  <v-container class="py-4">
    <!-- Промо-слайдер -->
    <v-row class="justify-center mb-8">
      <v-col cols="12" md="10" lg="8">
        <v-carousel cycle height="400" class="rounded-lg elevation-4">
          <v-carousel-item
            v-for="(promo, i) in promos"
            :key="i"
            :src="promo.image"
            cover
            @click="redirectToCatalog()"
            style="cursor: pointer"
          >
          </v-carousel-item>
        </v-carousel>
      </v-col>
    </v-row>

    <!-- Блок категорий -->
    <section class="mb-12">
      <h2 class="text-h4 mb-6">Категории товаров</h2>
      <v-row v-if="categories">
        <v-col
          v-for="category in categories"
          :key="category.id"
          cols="6"
          md="3"
        >
          <v-card
            :to="`/category/${category.id}`"
            height="200"
            class="position-relative"
          >
            <v-img :src="category.image" cover>
              <div class="d-flex fill-height align-center justify-center">
                <span class="font-weight-bold text-h5 text-center px-2">
                  {{ category.name }}
                </span>
              </div>
            </v-img>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="category in 3" :key="category" cols="6" md="3">
          <v-skeleton-loader class="border" type="card"></v-skeleton-loader>
        </v-col>
      </v-row>
    </section>

    <!-- Блок рекомендаций -->
    <section class="mb-12">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="text-h4">Возможно вам понравится</h2>
      </div>

      <v-slide-group show-arrows v-if="hybridRec">
        <v-slide-group-item
          v-for="product in hybridRec"
          :key="product?.product?.id"
          v-slot="{ isSelected, toggle }"
        >
          <ProductCard
            :title="product?.product?.title"
            :id="product?.product?.id"
            :desc="product?.product?.description"
            :img="product?.product?.thumbnail"
            class="ma-4"
          />
        </v-slide-group-item>
      </v-slide-group>

      <v-slide-group show-arrows v-else>
        <v-slide-group-item v-for="item in 5">
          <v-skeleton-loader
            class="border w-33 ma-4"
            type="card"
          ></v-skeleton-loader>
        </v-slide-group-item>
      </v-slide-group>
    </section>

    <!-- Блок популярных товаров -->
    <!-- <section class="mb-12">
      <h2 class="text-h4 mb-6">Популярные товары</h2>
      <v-row>
        <v-col
          v-for="product in 10"
          :key="product"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <ProductCard :product="product" />
        </v-col>
      </v-row>
    </section> -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import defaultImg from "@/assets/images/default-product.png";
import { useProductsStore } from "@/stores/products";
import { storeToRefs } from "pinia";
import router from "@/router";
import { id } from "vuetify/locale";
import { useRecommendationStore } from "@/stores/recommendation";

const currentPage = ref(1);

const promos = ref([
  {
    image: "/promo-1.jpg",
    title: "Новинки 2024",
    subtitle: "Самые свежие модели гаджетов",
    link: "/new",
  },
  {
    image: "/promo-2.jpg",
    title: "Скидки до 50%",
    subtitle: "Специальные предложения недели",
    link: "/sales",
  },
  {
    image: "/promo-3.jpg",
    title: "Скидки до 50%",
    subtitle: "Специальные предложения недели",
    link: "/sales",
  },
  {
    image: "/promo-4.jpg",
    title: "Скидки до 50%",
    subtitle: "Специальные предложения недели",
    link: "/sales",
  },
]);

const redirectToCatalog = () => {
  router.push("/");
};

const productStore = useProductsStore();
const recommendationStore = useRecommendationStore();

const { products, hybridRec, categories } = storeToRefs(productStore);
const { getProductForContentRec } = storeToRefs(recommendationStore);

onMounted(async () => {
  Promise.all([
    productStore.getAllProducts(),
    productStore.getAllCategories(),
    productStore.getHybridRecommendation(getProductForContentRec.value),
  ]);
});

watch(currentPage, async () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
</script>

<style scoped></style>
