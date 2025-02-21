<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card width="400" class="pa-5">
      <v-card-title class="text-center text-h5">Login</v-card-title>

      <v-form v-model="valid">
        <v-text-field
          v-model="email"
          label="E-mail"
          :rules="emailRules"
          required
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Пароль"
          type="password"
          :rules="passwordRules"
          required
        ></v-text-field>

        <v-btn
          :disabled="!valid"
          color="primary"
          block
          class="mt-3"
          @click="submitForm"
        >
          Login
        </v-btn>
      </v-form>

      <v-card-text class="text-center mt-3">
        Don't have an account?
        <router-link to="/register">register</router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
definePage({
  meta: {
    requiresGuest: true,
  },
});
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

import router from "@/router";

const authStore = useAuthStore();

const { token } = storeToRefs(authStore);

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const valid = ref(false);
const form = ref();

const emailRules = [
  (v: any) => !!v || "E-mail обязателен",
  (v: any) => /.+@.+\..+/.test(v) || "Введите корректный e-mail",
];

const passwordRules = [
  (v: any) => !!v || "Пароль обязателен",
  (v: any) => v.length >= 6 || "Пароль должен быть минимум 6 символов",
];

const nameRules = [(v: any) => !!v || "Обязательно для заполнения"];

const submitForm = async () => {
  await authStore.AuthClient(email.value, password.value);
  if (token.value) {
    router.push("/");
  }
};
</script>

<style></style>
