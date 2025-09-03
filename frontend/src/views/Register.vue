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
  <div class="flex min-h-[85vh] items-center justify-center">
    <div class="card w-full max-w-md bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl font-bold text-center">
          Register for TagSakay
        </h2>

        <div class="alert alert-error" v-if="error">
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

        <form @submit.prevent="register">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Full Name</span>
            </label>
            <input
              type="text"
              v-model="userData.name"
              placeholder="John Doe"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Email</span>
            </label>
            <input
              type="email"
              v-model="userData.email"
              placeholder="email@example.com"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              type="password"
              v-model="userData.password"
              placeholder="Password"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Confirm Password</span>
            </label>
            <input
              type="password"
              v-model="confirmPassword"
              placeholder="Confirm Password"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">RFID Tag (Optional)</span>
            </label>
            <input
              type="text"
              v-model="userData.rfidTag"
              placeholder="RFID Tag ID"
              class="input input-bordered"
            />
          </div>

          <div class="form-control mt-6">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span
                class="loading loading-spinner loading-xs"
                v-if="loading"
              ></span>
              {{ loading ? "Registering..." : "Register" }}
            </button>
          </div>
        </form>

        <div class="divider">OR</div>

        <div class="text-center">
          <router-link to="/login" class="link link-hover link-primary"
            >Already have an account? Login</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>
