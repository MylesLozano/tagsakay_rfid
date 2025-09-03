<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiKeyService from "../services/apiKey";
import type {
  ApiKey,
  CreateApiKeyData,
  ApiKeyResponse,
} from "../services/apiKey";

const router = useRouter();
const apiKeys = ref<ApiKey[]>([]);
const loading = ref(true);
const error = ref("");
const success = ref("");

const newApiKey = ref<CreateApiKeyData>({
  name: "",
  deviceId: "",
  description: "",
  permissions: ["scan"],
});

const createdKey = ref<string>("");
const isCreateModalOpen = ref(false);

onMounted(async () => {
  await loadApiKeys();
});

const goBack = () => {
  router.go(-1); // Go back to the previous page
};

const loadApiKeys = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await apiKeyService.listApiKeys();
    apiKeys.value = response;
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to load API keys.";
  } finally {
    loading.value = false;
  }
};

const createApiKey = async () => {
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const response: ApiKeyResponse = await apiKeyService.createApiKey(
      newApiKey.value
    );
    apiKeys.value.push(response);
    createdKey.value = response.key;
    success.value = "API key created successfully!";

    // Reset form
    newApiKey.value = {
      name: "",
      deviceId: "",
      description: "",
      permissions: ["scan"],
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to create API key.";
  } finally {
    loading.value = false;
  }
};

const updateApiKeyStatus = async (id: string, isActive: boolean) => {
  loading.value = true;
  error.value = "";

  try {
    await apiKeyService.updateApiKey(id, { isActive });

    // Update local state
    const index = apiKeys.value.findIndex((apiKey) => apiKey.id === id);
    if (index !== -1) {
      apiKeys.value[index].isActive = isActive;
    }

    success.value = `API key ${
      isActive ? "activated" : "deactivated"
    } successfully!`;
  } catch (err: any) {
    error.value =
      err.response?.data?.message || "Failed to update API key status.";
  } finally {
    loading.value = false;
  }
};

const revokeApiKey = async (id: string) => {
  if (
    !confirm(
      "Are you sure you want to revoke this API key? This action cannot be undone."
    )
  ) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await apiKeyService.revokeApiKey(id);

    // Remove from local state
    apiKeys.value = apiKeys.value.filter((apiKey) => apiKey.id !== id);

    success.value = "API key revoked successfully!";
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to revoke API key.";
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  success.value = "API key copied to clipboard!";

  // Clear success message after 3 seconds
  setTimeout(() => {
    if (success.value === "API key copied to clipboard!") {
      success.value = "";
    }
  }, 3000);
};
</script>

<template>
  <div>
    <div class="flex items-center mb-2">
      <button class="btn btn-ghost btn-circle mr-2" @click="goBack">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <h1 class="text-3xl font-bold">API Key Management</h1>
    </div>

    <div class="flex justify-end mb-6">
      <button class="btn btn-primary" @click="isCreateModalOpen = true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </svg>
        Create New API Key
      </button>
    </div>

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

    <div class="alert alert-success" v-if="success">
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
      <span>{{ success }}</span>
    </div>

    <div v-if="createdKey" class="alert alert-info mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="h-6 w-6 shrink-0 stroke-current"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <div>
        <span class="font-bold">New API Key Created:</span>
        <code class="block p-2 bg-base-300 mt-1 rounded">{{ createdKey }}</code>
        <span class="text-sm"
          >This key will only be shown once. Please copy it now.</span
        >
      </div>
      <button class="btn btn-sm" @click="copyToClipboard(createdKey)">
        Copy
      </button>
    </div>

    <div v-if="loading" class="flex justify-center my-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Name</th>
            <th>Device ID</th>
            <th>Prefix</th>
            <th>Permissions</th>
            <th>Status</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="apiKeys.length === 0">
            <td colspan="7" class="text-center">No API keys found</td>
          </tr>
          <tr v-for="apiKey in apiKeys" :key="apiKey.id">
            <td>{{ apiKey.name }}</td>
            <td>{{ apiKey.deviceId }}</td>
            <td>{{ apiKey.prefix }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="(permission, index) in apiKey.permissions"
                  :key="index"
                  class="badge badge-primary"
                >
                  {{ permission }}
                </span>
              </div>
            </td>
            <td>
              <span
                class="badge"
                :class="apiKey.isActive ? 'badge-success' : 'badge-error'"
              >
                {{ apiKey.isActive ? "Active" : "Inactive" }}
              </span>
            </td>
            <td>
              {{
                apiKey.lastUsed
                  ? new Date(apiKey.lastUsed).toLocaleString()
                  : "Never"
              }}
            </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm"
                  :class="apiKey.isActive ? 'btn-error' : 'btn-success'"
                  @click="updateApiKeyStatus(apiKey.id, !apiKey.isActive)"
                >
                  {{ apiKey.isActive ? "Deactivate" : "Activate" }}
                </button>
                <button
                  class="btn btn-sm btn-error"
                  @click="revokeApiKey(apiKey.id)"
                >
                  Revoke
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create API Key Modal -->
    <dialog :class="['modal', { 'modal-open': isCreateModalOpen }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Create New API Key</h3>

        <form @submit.prevent="createApiKey">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input
              type="text"
              v-model="newApiKey.name"
              placeholder="ESP32 Device 1"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Device ID</span>
            </label>
            <input
              type="text"
              v-model="newApiKey.deviceId"
              placeholder="ESP32-001"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Description (Optional)</span>
            </label>
            <textarea
              v-model="newApiKey.description"
              placeholder="RFID scanner at main entrance"
              class="textarea textarea-bordered"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Permissions</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <label class="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  checked
                  disabled
                  class="checkbox checkbox-primary"
                />
                <span class="label-text">scan (required)</span>
              </label>
            </div>
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="isCreateModalOpen = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span
                class="loading loading-spinner loading-xs"
                v-if="loading"
              ></span>
              Create
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="isCreateModalOpen = false">close</button>
      </form>
    </dialog>
  </div>
</template>
