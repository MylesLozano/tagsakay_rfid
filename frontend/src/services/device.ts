import apiClient from "./api";

interface DeviceRegistrationModeData {
  deviceId: string;
  enabled: boolean;
  tagId?: string;
}

interface DeviceInfo {
  id: string;
  name: string;
  lastActive: string;
  status: "online" | "offline";
  location?: string;
}

const deviceService = {
  /**
   * Get all active devices
   */
  async getActiveDevices(): Promise<DeviceInfo[]> {
    const response = await apiClient.get("/devices/active");
    return response.data;
  },

  /**
   * Set registration mode for a device
   * @param data DeviceRegistrationModeData
   */
  async setRegistrationMode(data: DeviceRegistrationModeData) {
    const response = await apiClient.post("/devices/registration-mode", data);
    return response.data;
  },
};

export default deviceService;
export type { DeviceRegistrationModeData, DeviceInfo };
