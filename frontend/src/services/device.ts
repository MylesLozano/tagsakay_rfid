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

export interface UpdateDeviceStatusRequest {
  isActive?: boolean;
  registrationMode?: boolean;
  pendingRegistrationTagId?: string;
  scanMode?: boolean;
}

const deviceService = {
  /**
   * Register a new device with its MAC address
   */
  registerDevice: async (deviceData: RegisterDeviceRequest): Promise<any> => {
    const response = await api.post("/devices/register", deviceData);
    return response.data.data;
  },

  /**
   * Get active devices that are online
   */
  getActiveDevices: async (): Promise<Device[]> => {
    const response = await api.get("/devices/active");
    return response.data.data || [];
  },

  /**
   * Get all registered devices
   */
  getAllDevices: async (): Promise<Device[]> => {
    const response = await api.get("/devices");
    return response.data.data.devices;
  },

  /**
   * Update device status (enable/disable)
   */
  updateDeviceStatus: async (
    id: number,
    statusData: UpdateDeviceStatusRequest
  ): Promise<Device> => {
    const response = await api.put(`/devices/${id}/status`, statusData);
    return response.data.data;
  },

  /**
   * Delete a device
   */
  deleteDevice: async (id: number): Promise<void> => {
    await api.delete(`/devices/${id}`);
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

  /**
   * Set registration mode for a device with more control
   */
  setRegistrationMode: async ({
    deviceId,
    enabled,
    tagId,
  }: {
    deviceId: string;
    enabled: boolean;
    tagId?: string;
  }): Promise<Device> => {
    const response = await api.post(`/devices/status/${deviceId}`, {
      registrationMode: enabled,
      pendingRegistrationTagId: tagId || "",
      scanMode: !tagId && enabled,
    });
    return response.data.data.device;
  },
};

export default deviceService;
