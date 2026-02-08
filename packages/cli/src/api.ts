import axios, { AxiosInstance } from 'axios';
import { config } from './config';

export interface Instance {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  url: string;
  railwayServiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  type: string;
  schema: Array<{
    name: string;
    type: string;
    required: boolean;
    options?: any;
  }>;
}

export class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'https://picobase.com') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private getAuthToken(): string | undefined {
    return config.getAuthToken();
  }

  async login(email: string, password: string): Promise<string> {
    const response = await this.client.post('/api/auth/login', {
      email,
      password,
    });
    return response.data.token;
  }

  async createInstance(name: string, subdomain: string): Promise<Instance> {
    const response = await this.client.post('/api/instances', {
      name,
      subdomain,
    });
    return response.data;
  }

  async getInstance(id: string): Promise<Instance> {
    const response = await this.client.get(`/api/instances/${id}`);
    return response.data;
  }

  async listInstances(): Promise<Instance[]> {
    const response = await this.client.get('/api/instances');
    return response.data;
  }

  async deleteInstance(id: string): Promise<void> {
    await this.client.delete(`/api/instances/${id}`);
  }

  async startInstance(id: string): Promise<void> {
    await this.client.post(`/api/instances/${id}/start`);
  }

  async stopInstance(id: string): Promise<void> {
    await this.client.post(`/api/instances/${id}/stop`);
  }

  async getApiKeys(instanceId: string): Promise<ApiKey[]> {
    const response = await this.client.get(`/api/instances/${instanceId}/api-keys`);
    return response.data;
  }

  async createApiKey(instanceId: string, name: string): Promise<ApiKey> {
    const response = await this.client.post(`/api/instances/${instanceId}/api-keys`, {
      name,
    });
    return response.data;
  }

  async getLogs(instanceId: string, lines: number = 100): Promise<string[]> {
    const response = await this.client.get(`/api/instances/${instanceId}/logs`, {
      params: { lines },
    });
    return response.data.logs || [];
  }

  async getCollections(instanceUrl: string, apiKey: string): Promise<Collection[]> {
    const response = await axios.get(`${instanceUrl}/api/collections`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.data;
  }
}

export const api = new ApiClient();
