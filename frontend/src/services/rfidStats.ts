import api from "./api";

export interface ScanStats {
  label: string;
  count: number;
}

export interface DeviceStatus {
  id: string;
  name: string;
  lastActive: string;
  status: "online" | "offline";
  location?: string;
}

const rfidStatsService = {
  /**
   * Get RFID scan statistics by day for the last 7 days
   */
  async getWeeklyStats(): Promise<ScanStats[]> {
    try {
      const response = await api.get("/rfid/stats/weekly");
      return response.data;
    } catch (error) {
      console.error("Error fetching weekly RFID stats:", error);
      return [];
    }
  },

  /**
   * Get RFID scan statistics by month for the last 6 months
   */
  async getMonthlyStats(): Promise<ScanStats[]> {
    try {
      const response = await api.get("/rfid/stats/monthly");
      return response.data;
    } catch (error) {
      console.error("Error fetching monthly RFID stats:", error);
      return [];
    }
  },

  /**
   * Get connected RFID devices status
   * Shows which ESP32 devices are currently connected
   */
  async getConnectedDevices(): Promise<DeviceStatus[]> {
    try {
      const response = await api.get("/devices/active");
      return response.data;
    } catch (error) {
      console.error("Error fetching connected RFID devices:", error);
      return []; // Return empty array if error occurs
    }
  },
};

export default rfidStatsService;
