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

  async passwordlessLoginStart(email: string): Promise<{ deviceId: string; preAuthSessionId: string }> {
    const response = await this.client.post('/auth/signinup/code', {
      email,
    });
    return response.data;
  }

  async passwordlessLoginConsume(preAuthSessionId: string, deviceId: string, userInputCode: string): Promise<string> {
    const response = await this.client.post('/auth/signinup/code/consume', {
      preAuthSessionId,
      deviceId,
      userInputCode,
    });

    // The response structure depends on SuperTokens. 
    // Usually it returns { status: "OK", user: {...}, createdNewUser: boolean }
    // The session cookie is set in the headers. 
    // However, for CLI, we might need an API Token if we are not using cookies.
    // Picobase seems to use Cookies for session management.
    // But the CLI stores a 'token'. 

    // Let's assume the response headers contain the session token or we can extract it.
    // If SuperTokens is used, the session tokens are in 'st-access-token' header or cookie.

    // For now, let's grab the cookie and use that as the "token" for subsequent requests,
    // assuming the API client handles cookie headers.

    // Actually, looking at the existing 'login' method:
    // return response.data.token;
    // This implies there is a custom endpoint '/api/auth/login' that returns a token.

    // If we use standard SuperTokens endpoints, we need to handle cookies.
    // But the existing CLI architecture seems to expect a Bearer token.

    // Let's try to extract the Anti-CSRF token or similar if needed, 
    // but SuperTokens usually sets cookies.

    // If we want to support CLI access, we might need a way to get a long-lived API key
    // or just use the session cookies.

    // Let's look at how the existing 'login' works. 
    // It calls '/api/auth/login'. 
    // Does that endpoint exist? It might be a custom one.

    // Since we are adding passwordless, we might be hitting SuperTokens directly.
    // SuperTokens doesn't return a simple "token" in the body by default.

    // HACK: for now, let's look at the headers and try to grab 'sAccessToken'.
    // Or we might need to update the CLI to support cookie-based auth.

    // Wait, the existing code:
    // this.client.interceptors.request.use((config) => { ... Authorization = Bearer ${token} ... })
    // So it sends Authorization header.

    // If we use SuperTokens, we can extract the Access Token from the response header 'st-access-token'.

    const accessToken = response.headers['st-access-token'];
    if (!accessToken) {
      throw new Error('No access token returned. Please check backend configuration.');
    }
    return accessToken;
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
