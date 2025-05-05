<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12" class="text-center">
        <h1 class="text-h3 font-weight-bold mb-4">Категории товаров</h1>
        <v-divider class="mb-8"></v-divider>
      </v-col>

      <template v-if="categories">
        <v-col
          v-for="category in categories"
          :key="category.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            :to="`/category/${category.id}`"
            class="category-card"
            elevation="2"
            hover
          >
            <v-card-title>
              {{ category.name }}
            </v-card-title>

            <v-card-subtitle v-if="category.description" class="pt-2">
              {{ category.description }}
            </v-card-subtitle>
          </v-card>
        </v-col>
      </template>

      <v-col v-else cols="12">
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useProductsStore } from "@/stores/products";
import { storeToRefs } from "pinia";

const productStore = useProductsStore();
const { categories } = storeToRefs(productStore);

onMounted(async () => {
  await productStore.getAllCategories();
});
</script>

<style scoped>
.category-card {
  transition: transform 0.3s ease;
  height: 100%;
}

.category-card:hover {
  transform: translateY(-5px);
}
</style>
