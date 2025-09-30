import apiClient from "./api";

interface ApiKey {
  id: string;
  name: string;
  deviceId: string;
  description: string | null;
  prefix: string;
  permissions: string[];
  lastUsed: string | null;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  macAddress?: string; // MAC address field
}

interface CreateApiKeyData {
  name: string;
  deviceId: string;
  macAddress?: string; // MAC address field
  description?: string;
  permissions?: string[];
}

interface ApiKeyResponse extends ApiKey {
  key: string; // Full key is only returned on creation
}

interface UpdateApiKeyData {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

const apiKeyService = {
  async createApiKey(data: CreateApiKeyData): Promise<any> {
    const response = await apiClient.post("/apiKeys", data);
    return response.data;
  },

  async listApiKeys(): Promise<ApiKey[]> {
    const response = await apiClient.get("/apiKeys");
    return response.data.data;
  },

  async updateApiKey(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
    const response = await apiClient.put(`/apiKeys/${id}`, data);
    return response.data;
  },

  async deleteApiKey(id: string): Promise<void> {
    await apiClient.delete(`/apiKeys/${id}`);
  },

  async revokeApiKey(id: string): Promise<void> {
    await apiClient.delete(`/apiKeys/${id}`);
  },
};

export default apiKeyService;
export type { ApiKey, CreateApiKeyData, UpdateApiKeyData, ApiKeyResponse };
