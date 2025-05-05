<template>
  <v-container class="py-8">
    <template v-if="currentCategory">
      <!-- Хлебные крошки -->
      <v-breadcrumbs :items="breadcrumbs" class="px-0"></v-breadcrumbs>

      <h1 class="text-h3 mb-4">{{ currentCategory.name }}</h1>

      <!-- Дочерние категории -->
      <section v-if="currentChildrenCategory.length" class="mb-8">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5">Подкатегории</h2>
          <v-btn
            v-if="showMoreVisible"
            @click="showAllChildren = !showAllChildren"
            variant="text"
            color="primary"
          >
            {{ showAllChildren ? "Свернуть" : "Показать еще" }}
          </v-btn>
        </div>

        <v-row>
          <v-col
            v-for="child in slicedChildren"
            :key="child.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card :to="`/category/${child.id}`" elevation="2" hover>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-folder</v-icon>
                {{ child.name }}
              </v-card-title>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <!-- Товары категории -->
    </template>

    <v-progress-linear v-else indeterminate color="primary"></v-progress-linear>
  </v-container>
  <section>
    <v-container class="py-12">
      <v-row>
        <v-col
          v-for="product in products?.products"
          :key="product.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="product-card" :to="`/products/${product.id}`" link>
            <v-img :src="product.images[0].url" height="300" contain></v-img>
            <v-card-title>{{ product.title }}</v-card-title>
            <v-card-subtitle>{{ product.description }}</v-card-subtitle>
            <v-card-actions>
              <v-btn
                color="default"
                @click.prevent="addToCart(product)"
                rounded="x-large"
                class="bg-accent text-button"
              >
                Купить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <v-spacer></v-spacer>
      <v-pagination
        class="mt-10"
        v-model="currentPage"
        :length="totalPage"
        :total-visible="10"
      ></v-pagination>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { useProductsStore } from "@/stores/products";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { computed } from "vue";

interface RouteParams {
  id: string;
}

const productStore = useProductsStore();
const { currentCategory, currentChildrenCategory, products } =
  storeToRefs(productStore);
const route = useRoute();

const id = computed(() => {
  return (route.params as RouteParams).id;
});

const currentPage = ref(1);

const limits = 20;

const offset = computed(() => (currentPage.value - 1) * limits);

const totalPage = computed(() => {
  if (products.value?.count) {
    return Math.floor(products.value?.count / limits);
  } else {
    return 0;
  }
});

const breadcrumbs = computed(() => [
  { title: "Главная", disabled: false, to: "/" },
  { title: "Категории", disabled: false, to: "/category" },
  { title: currentCategory.value?.name || "Загрузка...", disabled: true },
]);

const showAllChildren = ref(false);
const maxVisibleChildren = 10;

// Вычисляем свойства для отображения
const slicedChildren = computed(() => {
  if (!currentChildrenCategory.value) return [];
  return showAllChildren.value
    ? currentChildrenCategory.value
    : currentChildrenCategory.value.slice(0, maxVisibleChildren);
});

const showMoreVisible = computed(() => {
  return currentChildrenCategory.value?.length > maxVisibleChildren;
});

onMounted(async () => {
  await productStore.getCurrentCategories(id.value);
  await productStore.getProductsForCategories(limits, offset.value, id.value);
});

const addToCart = (product: any) => {
  // Логика добавления в корзину
};

watch(currentPage, async () => {
  await productStore.getProductsForCategories(limits, offset.value, id.value);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

watch(id, async () => {
  await productStore.getCurrentCategories(id.value);
  await productStore.getProductsForCategories(limits, offset.value, id.value);
  window.scrollTo({ top: 0, behavior: "smooth" });
});
</script>

<style scoped>
.v-card {
  transition: transform 0.3s ease;
}

.v-card:hover {
  transform: translateY(-3px);
}
</style>
