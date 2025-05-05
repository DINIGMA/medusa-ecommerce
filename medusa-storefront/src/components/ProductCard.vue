<template>
  <v-card class="product-card p-10">
    <v-img :src="img" height="200" contain></v-img>
    <v-card-title class="text-center">{{ title }}</v-card-title>
    <v-card-subtitle>{{ desc }}</v-card-subtitle>
    <v-card-actions>
      <v-btn :to="`/products/${id}`" color="primary">Подробнее</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
const props = defineProps({
  id: String,
  title: String,
  img: String,
  desc: {
    type: String,
    required: false,
  },
});
</script>

<style scoped>
.product-card {
  max-width: 25rem;
  padding: 0 16px;
}
</style>
