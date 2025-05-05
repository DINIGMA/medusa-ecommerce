<template>
  <v-app-bar app :height="100">
    <v-app-bar-title>
      <router-link
        to="/"
        class="logo"
        style="font-size: x-large; text-decoration: none"
        >Medusa shop</router-link
      >
    </v-app-bar-title>

    <!-- Меню -->
    <v-spacer></v-spacer>

    <v-btn to="/">Главная</v-btn>
    <v-btn to="category">Категории</v-btn>
    <v-btn>О нас</v-btn>

    <!-- Корзина -->
    <v-btn icon>
      <v-badge v-if="cartCount > 0">
        <v-icon>mdi-cart</v-icon>
      </v-badge>
      <v-icon v-else>mdi-cart</v-icon>
    </v-btn>

    <!-- Темная тема -->
    <v-btn icon @click="toggleTheme">
      <v-icon>{{ isDark ? "mdi-weather-sunny" : "mdi-weather-night" }}</v-icon>
    </v-btn>

    <v-btn icon @click="reviewStore.createReview()">
      <v-icon>mdi-account</v-icon>
    </v-btn>

    <v-btn icon v-if="token">
      <v-icon>mdi-account</v-icon>
    </v-btn>

    <template v-else>
      <v-btn to="/login" color="primary"> Войти </v-btn>
      <v-btn to="/register" color="secondary"> Зарегистрироваться </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useTheme } from "vuetify";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";
import { useReviewStore } from "@/stores/review";

const authStore = useAuthStore();
const reviewStore = useReviewStore();

const { token } = storeToRefs(authStore);

const cartCount = ref(3);
const theme = useTheme();

const isDark = computed(() => theme.global.current.value.dark);

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? "light" : "dark";
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};
</script>

<style></style>
