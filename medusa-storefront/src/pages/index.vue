<template>
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
          <v-img :src="defaultImg" height="250" cover></v-img>
          <v-card-title>{{ product.title }}</v-card-title>
          <v-card-subtitle>{{ product.description }} ₽</v-card-subtitle>
          <v-card-actions>
            <v-btn
              color="default"
              @click="addToCart(product)"
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
    ></v-pagination>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import defaultImg from "@/assets/images/default-product.png";
import { useProductsStore } from "@/stores/products";
import { storeToRefs } from "pinia";

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

const productStore = useProductsStore();
const { products } = storeToRefs(productStore);

const addToCart = (product: any) => {
  alert(`Добавлено в корзину: ${product.title}`);
};

onMounted(async () => {
  await productStore.getProducts(limits, offset.value);
});

watch(currentPage, async () => {
  await productStore.getProducts(limits, offset.value);
  window.scrollTo({ top: 0, behavior: "smooth" });
});
</script>
