<script setup lang="ts">
import { RouterView } from "vue-router";
import Navbar from "./components/Navbar.vue";
import authService from "./services/auth";

const isLoggedIn = authService.isLoggedIn();
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <Navbar v-if="isLoggedIn" />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<style>
body {
  font-family: "Inter", sans-serif;
}
</style>
