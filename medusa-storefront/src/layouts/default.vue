<template>
  <v-layout>
    <app-header></app-header>
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import AppHeader from "@/components/AppHeader.vue";
</script>
