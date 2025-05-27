// API Client Service for emergentRPG Backend Integration

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  APIConfig, 
  APIError, 
  NetworkError, 
  RequestOptions,
  GameSession,
  CreateSessionRequest,
  ActionResult,
  ScenarioTemplate,
  Lorebook,
  GenerationRequest,
  GenerationTask,
  HealthStatus,
  PerformanceMetrics,
  ScenarioFilters,
  LorebookFilters
} from '@/types';
import { API_ENDPOINTS, DEFAULT_VALUES } from '@/utils/constants';
import { retryWithBackoff, withTimeout } from '@/utils/helpers';
import { mockGameAPI } from './mockClient';

export class GameAPIClient {
  private client: AxiosInstance;
  private config: APIConfig;
  private useMockAPI: boolean = false;

  constructor(config?: Partial<APIConfig>) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
      timeout: DEFAULT_VALUES.API_TIMEOUT,
      retryAttempts: DEFAULT_VALUES.RETRY_ATTEMPTS,
      retryDelay: DEFAULT_VALUES.RETRY_DELAY,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth headers when available
        const authHeaders = this.getAuthHeaders();
        Object.keys(authHeaders).forEach(key => {
          config.headers.set(key, authHeaders[key]);
        });
        
        // Add request timestamp for debugging
        (config as any).metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time for debugging
        const duration = Date.now() - (response.config as any).metadata?.startTime;
        console.debug(`API Request to ${response.config.url} took ${duration}ms`);
        
        return response;
      },
      (error) => this.handleAPIError(error)
    );
  }

  private getAuthHeaders(): Record<string, string> {
    // Future implementation for authentication
    // const token = localStorage.getItem('authToken');
    // return token ? { Authorization: `Bearer ${token}` } : {};
    return {};
  }

  private handleAPIError(error: any): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const apiError = new APIError(
        error.response.data?.message || error.response.data?.detail || 'API Error',
        error.response.status,
        error.response.data
      );
      return Promise.reject(apiError);
    } else if (error.request) {
      // Network error - switch to mock API for development
      console.warn('Backend not available, switching to mock API');
      this.useMockAPI = true;
      return Promise.reject(new NetworkError('Network connection failed'));
    } else {
      // Other error
      return Promise.reject(error);
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url,
      params: options.params,
      data: options.data,
      headers: options.headers,
      timeout: options.timeout || this.config.timeout,
    };

    const makeRequest = async (): Promise<T> => {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    };

    // Apply retry logic with exponential backoff
    const retries = options.retries ?? this.config.retryAttempts;
    return retryWithBackoff(makeRequest, retries, this.config.retryDelay);
  }

  // Convenience methods
  private get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', url, options);
  }

  private post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', url, { ...options, data });
  }

  private put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', url, { ...options, data });
  }

  private delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, options);
  }

  // Health and System endpoints
  async getHealthStatus(): Promise<HealthStatus> {
    return this.get<HealthStatus>(API_ENDPOINTS.HEALTH);
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.get<PerformanceMetrics>(API_ENDPOINTS.PERFORMANCE);
  }

  // Game Session endpoints
  async createSession(data: CreateSessionRequest): Promise<{ session_id: string }> {
    return this.post<{ session_id: string }>(API_ENDPOINTS.SESSIONS, data);
  }

  async getSession(sessionId: string): Promise<{ session: GameSession }> {
    try {
      return await this.get<{ session: GameSession }>(API_ENDPOINTS.SESSION_BY_ID(sessionId));
    } catch (error) {
      console.warn('Using mock API for getSession');
      return await mockGameAPI.getSession(sessionId);
    }
  }

  async getSessions(): Promise<{ sessions: GameSession[] }> {
    try {
      return await this.get<{ sessions: GameSession[] }>(API_ENDPOINTS.SESSIONS);
    } catch (error) {
      // Fallback to mock API if backend is not available
      console.warn('Using mock API for getSessions');
      return await mockGameAPI.getSessions();
    }
  }

  async performAction(sessionId: string, action: string): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.SESSION_ACTION(sessionId), { action });
  }

  async saveSession(sessionId: string, sessionData: Partial<GameSession>): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(API_ENDPOINTS.SESSION_BY_ID(sessionId), sessionData);
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(API_ENDPOINTS.SESSION_BY_ID(sessionId));
  }

  // Lorebook endpoints
  async getLorebooks(filters?: LorebookFilters): Promise<{ lorebooks: Lorebook[] }> {
    return this.get<{ lorebooks: Lorebook[] }>(API_ENDPOINTS.LOREBOOKS, { params: filters });
  }

  async getLorebookDetails(lorebookId: string): Promise<{ lorebook: Lorebook }> {
    return this.get<{ lorebook: Lorebook }>(API_ENDPOINTS.LOREBOOK_BY_ID(lorebookId));
  }

  async deleteLorebook(lorebookId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(API_ENDPOINTS.LOREBOOK_BY_ID(lorebookId));
  }

  // Scenario endpoints
  async getScenarios(filters?: ScenarioFilters): Promise<{ templates: ScenarioTemplate[] }> {
    return this.get<{ templates: ScenarioTemplate[] }>(API_ENDPOINTS.SCENARIOS, { params: filters });
  }

  async startScenarioGeneration(request: GenerationRequest): Promise<{ task_id: string; status: string; message: string }> {
    return this.post<{ task_id: string; status: string; message: string }>(
      API_ENDPOINTS.SCENARIO_GENERATE, 
      request
    );
  }

  async getGenerationStatus(taskId: string): Promise<GenerationTask> {
    return this.get<GenerationTask>(API_ENDPOINTS.SCENARIO_STATUS(taskId));
  }

  // AI Service endpoints
  async generateAIResponse(context: any, action: string): Promise<{ success: boolean; response: any; cached: boolean }> {
    return this.post<{ success: boolean; response: any; cached: boolean }>(
      API_ENDPOINTS.AI_GENERATE,
      { context, action }
    );
  }

  async validateAction(action: string, gameState: any): Promise<{ success: boolean; action: string; is_valid: boolean; validation_details: any }> {
    return this.post<{ success: boolean; action: string; is_valid: boolean; validation_details: any }>(
      API_ENDPOINTS.AI_VALIDATE,
      { action, game_state: gameState }
    );
  }

  // Utility methods
  async ping(): Promise<{ success: boolean; timestamp: string }> {
    return this.get<{ success: boolean; timestamp: string }>('/api/ping');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getHealthStatus();
      return true;
    } catch {
      return false;
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update axios instance
    this.client.defaults.baseURL = this.config.baseURL;
    this.client.defaults.timeout = this.config.timeout;
  }

  getConfig(): APIConfig {
    return { ...this.config };
  }

  // Request cancellation
  createCancelToken() {
    return axios.CancelToken.source();
  }

  isRequestCancelled(error: any): boolean {
    return axios.isCancel(error);
  }
}

// Create and export a singleton instance
export const gameAPI = new GameAPIClient();

// Export the class for custom instances
export default GameAPIClient;
