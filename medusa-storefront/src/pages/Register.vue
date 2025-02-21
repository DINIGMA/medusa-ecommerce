<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card width="400" class="pa-5">
      <v-card-title class="text-center text-h5">Регистрация</v-card-title>

      <v-form ref="" v-model="valid">
        <v-text-field
          v-model="email"
          label="E-mail"
          :rules="emailRules"
          required
        ></v-text-field>

        <v-text-field
          v-model="firstName"
          label="First name"
          :rules="nameRules"
          required
        ></v-text-field>

        <v-text-field
          v-model="lastName"
          label="Last name"
          :rules="emailRules"
          required
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          :rules="passwordRules"
          required
        ></v-text-field>

        <v-text-field
          v-model="confirmPassword"
          label="Confirm password"
          type="password"
          :rules="confirmPasswordRules"
          required
        ></v-text-field>

        <v-btn
          :disabled="!valid"
          color="primary"
          block
          class="mt-3"
          @click="submit"
        >
          Зарегистрироваться
        </v-btn>
      </v-form>

      <v-card-text class="text-center mt-3">
        Уже есть аккаунт?
        <router-link to="/login">Войти</router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const router = useRouter();

const authStore = useAuthStore();

const email = ref<string>("");
const firstName = ref<string>("");
const lastName = ref<string>("");
const password = ref<string>("");
const confirmPassword = ref<string>("");
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

const confirmPasswordRules = [
  (v: any) => !!v || "Подтверждение пароля обязательно",
  (v: any) => v === password.value || "Пароли не совпадают",
];

const submit = async () => {
  if (form.value.validate()) {
    await authStore.registerClient(
      firstName.value,
      lastName.value,
      email.value,
      password.value
    );
    router.push("/login");
  }
};
</script>
