<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import rfidService from "../services/rfid";
import type { Rfid, RegisterRfidData } from "../services/rfid";

const router = useRouter();
const rfids = ref<Rfid[]>([]);
const loading = ref(true);
const error = ref("");
const success = ref("");

const newRfid = ref<RegisterRfidData>({
  tagId: "",
  userId: undefined,
  metadata: {},
});

const isRegisterModalOpen = ref(false);

onMounted(async () => {
  await loadRfids();
});

const goBack = () => {
  router.go(-1); // Go back to the previous page
};

const loadRfids = async () => {
  loading.value = true;
  error.value = "";

  try {
    // Simulate getting RFID list since the backend doesn't seem to have this endpoint
    // In a real app, you would call something like:
    // const response = await apiClient.get('/rfid');
    // rfids.value = response.data;

    // For demo purposes, using mock data
    rfids.value = [
      {
        id: "1",
        tagId: "RFID12345",
        userId: 1,
        isActive: true,
        lastScanned: "2025-09-01T10:30:00Z",
        deviceId: "ESP32-001",
        registeredBy: 1,
        metadata: { vehicleType: "Tricycle", plateNumber: "ABC123" },
        createdAt: "2025-08-15T08:00:00Z",
        updatedAt: "2025-09-01T10:30:00Z",
      },
      {
        id: "2",
        tagId: "RFID67890",
        userId: 2,
        isActive: true,
        lastScanned: "2025-09-03T14:45:00Z",
        deviceId: "ESP32-002",
        registeredBy: 1,
        metadata: { vehicleType: "Tricycle", plateNumber: "XYZ789" },
        createdAt: "2025-08-20T09:15:00Z",
        updatedAt: "2025-09-03T14:45:00Z",
      },
    ];
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to load RFID tags.";
  } finally {
    loading.value = false;
  }
};

const registerRfid = async () => {
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const response = await rfidService.registerRfid(newRfid.value);
    rfids.value.push(response);
    success.value = "RFID tag registered successfully!";
    isRegisterModalOpen.value = false;

    // Reset form
    newRfid.value = {
      tagId: "",
      userId: undefined,
      metadata: {},
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to register RFID tag.";
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (id: string, isActive: boolean) => {
  loading.value = true;
  error.value = "";

  try {
    await rfidService.updateRfidStatus(id, isActive);

    // Update local state
    const index = rfids.value.findIndex((rfid) => rfid.id === id);
    if (index !== -1) {
      rfids.value[index].isActive = isActive;
    }

    success.value = `RFID tag ${
      isActive ? "activated" : "deactivated"
    } successfully!`;
  } catch (err: any) {
    error.value =
      err.response?.data?.message || "Failed to update RFID status.";
  } finally {
    loading.value = false;
  }
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
      <h1 class="text-3xl font-bold">RFID Management</h1>
    </div>

    <div class="flex justify-end mb-6">
      <button class="btn btn-primary" @click="isRegisterModalOpen = true">
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
        Register New RFID
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

    <div v-if="loading" class="flex justify-center my-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Tag ID</th>
            <th>User ID</th>
            <th>Status</th>
            <th>Last Scanned</th>
            <th>Device</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rfids.length === 0">
            <td colspan="6" class="text-center">No RFID tags found</td>
          </tr>
          <tr v-for="rfid in rfids" :key="rfid.id">
            <td>{{ rfid.tagId }}</td>
            <td>{{ rfid.userId || "N/A" }}</td>
            <td>
              <span
                class="badge"
                :class="rfid.isActive ? 'badge-success' : 'badge-error'"
              >
                {{ rfid.isActive ? "Active" : "Inactive" }}
              </span>
            </td>
            <td>
              {{
                rfid.lastScanned
                  ? new Date(rfid.lastScanned).toLocaleString()
                  : "Never"
              }}
            </td>
            <td>{{ rfid.deviceId || "N/A" }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm"
                  :class="rfid.isActive ? 'btn-error' : 'btn-success'"
                  @click="updateStatus(rfid.id, !rfid.isActive)"
                >
                  {{ rfid.isActive ? "Deactivate" : "Activate" }}
                </button>
                <button class="btn btn-sm btn-info">Details</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Register RFID Modal -->
    <dialog :class="['modal', { 'modal-open': isRegisterModalOpen }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Register New RFID Tag</h3>

        <form @submit.prevent="registerRfid">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Tag ID</span>
            </label>
            <input
              type="text"
              v-model="newRfid.tagId"
              placeholder="Enter RFID Tag ID"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">User ID (Optional)</span>
            </label>
            <input
              type="number"
              v-model="newRfid.userId"
              placeholder="User ID to associate with this tag"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Metadata (Optional)</span>
            </label>
            <textarea
              :value="JSON.stringify(newRfid.metadata, null, 2)"
              @input="
                (e) => {
                  try {
                    if (e.target) {
                      newRfid.metadata = JSON.parse((e.target as HTMLTextAreaElement).value);
                    }
                  } catch {}
                }
              "
              placeholder="JSON metadata"
              class="textarea textarea-bordered h-24"
            ></textarea>
            <label class="label">
              <span class="label-text-alt"
                >Enter JSON data for additional information</span
              >
            </label>
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="isRegisterModalOpen = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span
                class="loading loading-spinner loading-xs"
                v-if="loading"
              ></span>
              Register
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="isRegisterModalOpen = false">close</button>
      </form>
    </dialog>
  </div>
</template>
