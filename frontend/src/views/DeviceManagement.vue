<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">RFID Device Management</h1>

    <!-- Registration Form -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 class="text-xl font-semibold mb-4">Register New Device</h2>
      <form @submit.prevent="registerDevice">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >MAC Address</label
            >
            <input
              v-model="newDevice.macAddress"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Format: XX:XX:XX:XX:XX:XX"
              required
            />
            <p class="mt-1 text-sm text-gray-500">
              Enter the MAC address of the ESP32 device
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Device Name</label
            >
            <input
              v-model="newDevice.name"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Location</label
            >
            <input
              v-model="newDevice.location"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p class="mt-1 text-sm text-gray-500">
              Where this device is installed
            </p>
          </div>
        </div>

        <div class="mt-6">
          <button
            type="submit"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Register Device
          </button>
        </div>
      </form>
    </div>

    <!-- Devices List -->
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <div class="px-4 py-5 sm:px-6">
        <h2 class="text-lg font-medium text-gray-900">Registered Devices</h2>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          List of all registered RFID readers
        </p>
      </div>

      <div class="border-t border-gray-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  MAC Address
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Seen
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="device in devices" :key="device.id">
                <td class="px-6 py-4 whitespace-nowrap">{{ device.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap font-mono text-sm">
                  {{ device.macAddress }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ device.location }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      device.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800',
                    ]"
                  >
                    {{ device.isActive ? "Active" : "Inactive" }}
                  </span>
                  <span
                    v-if="device.registrationMode"
                    class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                  >
                    Registration Mode
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ device.lastSeen ? formatDate(device.lastSeen) : "Never" }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    v-if="!device.registrationMode"
                    @click="enableRegistrationMode(device.deviceId)"
                    class="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Enable Registration
                  </button>
                  <button
                    v-else
                    @click="disableRegistrationMode(device.deviceId)"
                    class="text-red-600 hover:text-red-900 mr-4"
                  >
                    Disable Registration
                  </button>
                </td>
              </tr>
              <tr v-if="devices.length === 0">
                <td
                  colspan="6"
                  class="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No devices registered yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import deviceService, {
  type Device,
  type RegisterDeviceRequest,
} from "../services/device";

export default defineComponent({
  name: "DeviceManagement",

  setup() {
    const devices = ref<Device[]>([]);
    const newDevice = ref<RegisterDeviceRequest>({
      macAddress: "",
      name: "",
      location: "",
    });
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Fetch all devices when component mounts
    const fetchDevices = async () => {
      try {
        loading.value = true;
        devices.value = await deviceService.getAllDevices();
      } catch (err) {
        error.value = "Failed to fetch devices";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    // Register a new device
    const registerDevice = async () => {
      try {
        loading.value = true;
        await deviceService.registerDevice(newDevice.value);

        // Reset form
        newDevice.value = {
          macAddress: "",
          name: "",
          location: "",
        };

        // Refresh device list
        await fetchDevices();
      } catch (err) {
        error.value = "Failed to register device";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    // Enable registration mode
    const enableRegistrationMode = async (deviceId: string) => {
      try {
        loading.value = true;
        await deviceService.enableRegistrationMode(deviceId);
        await fetchDevices();
      } catch (err) {
        error.value = "Failed to enable registration mode";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    // Disable registration mode
    const disableRegistrationMode = async (deviceId: string) => {
      try {
        loading.value = true;
        await deviceService.disableRegistrationMode(deviceId);
        await fetchDevices();
      } catch (err) {
        error.value = "Failed to disable registration mode";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    };

    onMounted(fetchDevices);

    return {
      devices,
      newDevice,
      loading,
      error,
      registerDevice,
      enableRegistrationMode,
      disableRegistrationMode,
      formatDate,
    };
  },
});
</script>
