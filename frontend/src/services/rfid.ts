import apiClient from "./api";

interface Rfid {
  id: string;
  tagId: string;
  userId: number | null;
  isActive: boolean;
  lastScanned: string | null;
  deviceId: string | null;
  registeredBy: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface RfidScan {
  id: string;
  rfidTagId: string;
  deviceId: string;
  userId: number | null;
  eventType: "entry" | "exit" | "unknown";
  location: string | null;
  vehicleId: string | null;
  scanTime: string;
  status: "success" | "failed" | "unauthorized";
  metadata: Record<string, any>;
}

interface RegisterRfidData {
  tagId: string;
  userId?: number;
  metadata?: Record<string, any>;
}

const rfidService = {
  async registerRfid(data: RegisterRfidData): Promise<Rfid> {
    const response = await apiClient.post("/rfid/register", data);
    return response.data;
  },

  async getRfidInfo(id: string): Promise<Rfid> {
    const response = await apiClient.get(`/rfid/${id}`);
    return response.data;
  },

  async updateRfidStatus(id: string, isActive: boolean): Promise<Rfid> {
    const response = await apiClient.put(`/rfid/${id}/status`, { isActive });
    return response.data;
  },
};

export default rfidService;
export type { Rfid, RfidScan, RegisterRfidData };
