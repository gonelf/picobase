import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  authToken?: string;
  currentInstance?: string;
  instances?: Record<string, InstanceConfig>;
}

export interface InstanceConfig {
  id: string;
  name: string;
  url: string;
  apiKey: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.picobase');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.load();
  }

  private load(): Config {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {};
    }
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  private save(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  getAuthToken(): string | undefined {
    return this.config.authToken;
  }

  setAuthToken(token: string): void {
    this.config.authToken = token;
    this.save();
  }

  getCurrentInstance(): InstanceConfig | undefined {
    if (!this.config.currentInstance || !this.config.instances) {
      return undefined;
    }
    return this.config.instances[this.config.currentInstance];
  }

  setCurrentInstance(instanceId: string): void {
    this.config.currentInstance = instanceId;
    this.save();
  }

  addInstance(instance: InstanceConfig): void {
    if (!this.config.instances) {
      this.config.instances = {};
    }
    this.config.instances[instance.id] = instance;
    this.save();
  }

  getInstance(id: string): InstanceConfig | undefined {
    return this.config.instances?.[id];
  }

  removeInstance(id: string): void {
    if (this.config.instances) {
      delete this.config.instances[id];
      if (this.config.currentInstance === id) {
        this.config.currentInstance = undefined;
      }
      this.save();
    }
  }

  listInstances(): InstanceConfig[] {
    return Object.values(this.config.instances || {});
  }

  clear(): void {
    this.config = {};
    this.save();
  }
}

export const config = new ConfigManager();
