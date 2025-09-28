import api from "./api";

export interface Device {
  id: number;
  deviceId: string;
  macAddress: string;
  name: string;
  location: string;
  isActive: boolean;
  registrationMode: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDeviceRequest {
  macAddress: string;
  name: string;
  location: string;
}

const deviceService = {
  /**
   * Register a new device with its MAC address
   */
  registerDevice: async (
    deviceData: RegisterDeviceRequest
  ): Promise<Device> => {
    const response = await api.post("/devices/register", deviceData);
    return response.data.data.device;
  },

  /**
   * Get all registered devices
   */
  getAllDevices: async (): Promise<Device[]> => {
    const response = await api.get("/devices");
    return response.data.data.devices;
  },

  /**
   * Enable registration mode for a device
   */
  enableRegistrationMode: async (
    deviceId: string,
    tagId?: string
  ): Promise<Device> => {
    const response = await api.post(`/devices/status/${deviceId}`, {
      registrationMode: true,
      pendingRegistrationTagId: tagId || "",
      scanMode: !tagId,
    });
    return response.data.data.device;
  },

  /**
   * Disable registration mode for a device
   */
  disableRegistrationMode: async (deviceId: string): Promise<Device> => {
    const response = await api.post(`/devices/status/${deviceId}`, {
      registrationMode: false,
      pendingRegistrationTagId: "",
    });
    return response.data.data.device;
  },
};

export default deviceService;
