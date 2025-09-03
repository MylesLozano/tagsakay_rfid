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
}

interface CreateApiKeyData {
  name: string;
  deviceId: string;
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
  async createApiKey(data: CreateApiKeyData): Promise<ApiKeyResponse> {
    const response = await apiClient.post("/keys", data);
    return response.data;
  },

  async listApiKeys(): Promise<ApiKey[]> {
    const response = await apiClient.get("/keys");
    return response.data;
  },

  async updateApiKey(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
    const response = await apiClient.put(`/keys/${id}`, data);
    return response.data;
  },

  async revokeApiKey(id: string): Promise<void> {
    await apiClient.delete(`/keys/${id}`);
  },
};

export default apiKeyService;
export type { ApiKey, CreateApiKeyData, UpdateApiKeyData, ApiKeyResponse };
