import apiClient from "./api";

// User service interfaces
export interface UserCredentials {
  name?: string;
  email: string;
  password: string;
  role?: string;
  isActive?: boolean;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

// Get all users
const getUsers = async () => {
  const response = await apiClient.get("/users");
  return response.data;
};

// Get a specific user
const getUser = async (id: number) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

// Create a new user
const createUser = async (userData: UserCredentials) => {
  const response = await apiClient.post("/users", userData);
  return response.data;
};

// Update a user
const updateUser = async (id: number, userData: UserUpdateData) => {
  const response = await apiClient.put(`/users/${id}`, userData);
  return response.data;
};

// Delete a user
const deleteUser = async (id: number) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
