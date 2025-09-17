<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import authService from "../services/auth";
import type { RegisterData } from "../services/auth";

const router = useRouter();
const userData = ref<RegisterData>({
  name: "",
  email: "",
  password: "",
  role: "driver", // Default role
});
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const register = async () => {
  if (userData.value.password !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await authService.register(userData.value);
    authService.saveUserData(response);
    router.push("/dashboard");
  } catch (err: any) {
    error.value =
      err.response?.data?.message || "Registration failed. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-[85vh] items-center justify-center p-6">
    <div class="card bg-base-200 shadow-xl w-full max-w-lg">
      <div class="card-body p-8">
        <h2 class="card-title text-3xl font-bold justify-center mb-6">
          Register for TagSakay
        </h2>

        <div v-if="error" class="alert alert-error mb-6" role="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ error }}</span>
        </div>

        <form @submit.prevent="register" class="space-y-6">
          <div class="form-control w-full">
            <label class="label" for="name">
              <span class="label-text text-base font-medium">Full Name</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              v-model="userData.name"
              placeholder="John Doe"
              class="input input-bordered input-primary w-full"
              required
              autocomplete="name"
            />
          </div>

          <div class="form-control w-full">
            <label class="label" for="email">
              <span class="label-text text-base font-medium">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              v-model="userData.email"
              placeholder="email@example.com"
              class="input input-bordered input-primary w-full"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-control w-full">
            <label class="label" for="password">
              <span class="label-text text-base font-medium">Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              v-model="userData.password"
              placeholder="Password"
              class="input input-bordered input-primary w-full"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-control w-full">
            <label class="label" for="confirmPassword">
              <span class="label-text text-base font-medium"
                >Confirm Password</span
              >
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm Password"
              class="input input-bordered input-primary w-full"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-control w-full">
            <label class="label" for="rfidTag">
              <span class="label-text text-base font-medium"
                >RFID Tag
                <span class="text-xs opacity-70">(Optional)</span></span
              >
            </label>
            <input
              type="text"
              id="rfidTag"
              name="rfidTag"
              v-model="userData.rfidTag"
              placeholder="RFID Tag ID"
              class="input input-bordered input-primary w-full"
              autocomplete="off"
            />
          </div>

          <div class="card-actions justify-end mt-8">
            <button
              type="submit"
              class="btn btn-primary w-full text-base"
              :disabled="loading"
            >
              <span
                class="loading loading-spinner loading-sm"
                v-if="loading"
              ></span>
              {{ loading ? "Registering..." : "Register" }}
            </button>
          </div>
        </form>

        <div class="divider my-8">OR</div>

        <div class="text-center">
          <router-link
            to="/login"
            class="link link-hover link-primary text-base"
          >
            Already have an account? Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
