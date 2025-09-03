<script setup lang="ts">
import { ref, onMounted } from "vue";
import authService from "../services/auth";
import type { User } from "../services/auth";

const user = ref<User | null>(null);
const loading = ref(true);

onMounted(async () => {
  user.value = authService.getUser();
  loading.value = false;
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <div v-if="loading" class="flex justify-center my-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else>
      <div class="card bg-base-200 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title">Welcome, {{ user?.name }}!</h2>
          <p class="mb-4">
            Role: <span class="badge badge-primary">{{ user?.role }}</span>
          </p>

          <div class="stats shadow">
            <div class="stat">
              <div class="stat-title">RFID Tag</div>
              <div class="stat-value text-xl">
                {{ user?.rfidTag || "Not assigned" }}
              </div>
              <div class="stat-desc">Your assigned RFID Tag</div>
            </div>

            <div class="stat">
              <div class="stat-title">Account Status</div>
              <div class="stat-value text-xl">
                <span
                  class="badge"
                  :class="user?.isActive ? 'badge-success' : 'badge-error'"
                >
                  {{ user?.isActive ? "Active" : "Inactive" }}
                </span>
              </div>
              <div class="stat-desc">Your current account status</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Recent Activity</h2>
            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="user?.role === 'driver'">
                    <td colspan="3" class="text-center">No recent activity</td>
                  </tr>
                  <tr v-else>
                    <td>2025-09-04</td>
                    <td>Login</td>
                    <td><span class="badge badge-success">Success</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">System Status</h2>
            <div class="alert alert-success">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>TagSakay System is operational</span>
            </div>
            <div class="mt-4">
              <p>Last API Server Heartbeat: 2025-09-04 08:15:22</p>
              <p>Active RFID Readers: 2</p>
              <p>Scans Today: 42</p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="user?.role === 'admin' || user?.role === 'superadmin'"
        class="card bg-base-200 shadow-xl"
      >
        <div class="card-body">
          <h2 class="card-title">Admin Quick Links</h2>
          <div class="flex flex-wrap gap-2">
            <router-link to="/rfid" class="btn btn-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM9 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM9 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1zM6 17a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              RFID Management
            </router-link>
            <router-link to="/apikeys" class="btn btn-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              API Keys
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
