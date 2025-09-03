import apiClient from "./api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  rfidTag?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  rfidTag?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },

  getUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem("token");
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "admin" || user?.role === "superadmin";
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  saveUserData(data: AuthResponse): void {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },
};

export default authService;
export type { User, LoginCredentials, RegisterData, AuthResponse };
