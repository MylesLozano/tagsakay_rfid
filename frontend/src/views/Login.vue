<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import authService from "../services/auth";
import type { LoginCredentials } from "../services/auth";

const router = useRouter();
const credentials = ref<LoginCredentials>({
  email: "",
  password: "",
});
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);

const login = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await authService.login(credentials.value);
    authService.saveUserData(response);
    router.push("/dashboard");
  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      "Login failed. Please check your credentials.";
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
          Login to TagSakay
        </h2>

        <div class="alert alert-error mb-6" v-if="error">
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

        <form @submit.prevent="login" class="space-y-6">
          <div class="form-control w-full">
            <label class="label" for="email">
              <span class="label-text text-base font-medium">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              v-model="credentials.email"
              placeholder="email@example.com"
              class="input input-bordered input-primary w-full"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-control w-full">
            <label class="label" for="password">
              <span class="label-text text-base font-medium">Password</span>
            </label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                v-model="credentials.password"
                placeholder="Password"
                class="input input-bordered input-primary w-full pr-10"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
                @click="showPassword = !showPassword"
              >
                <!-- Eye icon when password is hidden -->
                <svg
                  v-if="!showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <!-- Eye-slash icon when password is visible -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
            <div class="label justify-end mt-3">
              <a href="#" class="label-text-alt link link-hover text-primary"
                >Forgot password?</a
              >
            </div>
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
              {{ loading ? "Logging in..." : "Login" }}
            </button>
          </div>
        </form>

        <div class="divider my-8">OR</div>

        <div class="text-center">
          <router-link
            to="/register"
            class="link link-hover link-primary text-base"
            >Register a new account</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>
