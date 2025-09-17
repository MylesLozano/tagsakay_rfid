<script setup lang="ts">
import { RouterView, useRouter } from "vue-router";
import { ref, watchEffect } from "vue";
import Navbar from "./components/Navbar.vue";
import authService from "./services/auth";

const router = useRouter();
const isLoggedIn = ref(authService.isLoggedIn());

// Listen for changes in localStorage to update isLoggedIn reactively
window.addEventListener("storage", () => {
  isLoggedIn.value = authService.isLoggedIn();
});

// Watch for route changes and update isLoggedIn
watchEffect(() => {
  isLoggedIn.value = authService.isLoggedIn();
  // If not logged in and not on login or register page, redirect to login
  if (
    !isLoggedIn.value &&
    router.currentRoute.value.path !== "/login" &&
    router.currentRoute.value.path !== "/register"
  ) {
    router.push("/login");
  }
});
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
