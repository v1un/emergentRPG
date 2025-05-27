// Mock API Client for Development
// This provides mock data when the backend is not available

import { 
  GameSession, 
  ScenarioTemplate, 
  Lorebook, 
  ActionResult,
  HealthStatus,
  PerformanceMetrics,
  GenerationTask,
  CreateSessionRequest,
  GenerationRequest,
  ScenarioFilters,
  LorebookFilters
} from '@/types';

export class MockAPIClient {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Mock data
  private mockSession: GameSession = {
    session_id: 'mock-session-1',
    scenario_id: 'mock-scenario-1',
    character: {
      name: 'Adventurer',
      level: 1,
      health: 100,
      max_health: 100,
      mana: 50,
      max_mana: 50,
      experience: 0,
      stats: {
        strength: 12,
        dexterity: 14,
        constitution: 13,
        intelligence: 15,
        wisdom: 11,
        charisma: 10
      },
      class_name: 'Adventurer',
      background: 'A brave soul seeking adventure',
      equipped_items: {
        weapon: '',
        armor: '',
        helmet: '',
        boots: '',
        accessory: ''
      },
      max_carry_weight: 100
    },
    inventory: [],
    world_state: {
      current_location: 'Starting Village',
      time_of_day: 'morning',
      weather: 'clear',
      npcs_present: ['Village Elder', 'Merchant'],
      available_actions: ['explore', 'talk to villagers', 'check inventory'],
      special_conditions: []
    },
    story: [
      {
        id: 'story-1',
        type: 'narration',
        text: 'Welcome to emergentRPG! You find yourself in a peaceful village at the start of your adventure.',
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ],
    quests: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
  };

  private mockScenarios: ScenarioTemplate[] = [
    {
      id: 'scenario-1',
      title: 'The Forgotten Village',
      description: 'A mysterious village appears in the mist, hiding ancient secrets.',
      genre: 'mystery',
      setting: 'fantasy village',
      initial_narrative: 'You stumble upon a village that shouldn\'t exist...',
      metadata: {}
    }
  ];

  private mockLorebooks: Lorebook[] = [
    {
      id: 'lorebook-1',
      title: 'Basic Fantasy World',
      description: 'Essential knowledge for fantasy adventures',
      characters: [
        {
          name: 'Village Elder',
          role: 'wise guide',
          description: 'An old man with knowledge of ancient secrets'
        }
      ],
      locations: [
        {
          name: 'Starting Village',
          description: 'A peaceful settlement where adventures begin'
        }
      ],
      lore: [
        {
          title: 'Magic System',
          content: 'Magic flows through ley lines across the world...'
        }
      ],
      metadata: {}
    }
  ];

  // Health and System endpoints
  async getHealthStatus(): Promise<HealthStatus> {
    await this.delay(100);
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-mock',
      services: {
        database: 'healthy',
        ai_service: 'healthy',
        cache: 'healthy'
      },
      performance: {
        uptime: 3600,
        memory_usage: 45.2,
        cpu_usage: 12.8
      },
      configuration: {
        environment: 'development',
        debug_mode: true
      }
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    await this.delay(100);
    return {
      timestamp: new Date().toISOString(),
      summary: {
        total_operations: 1000,
        avg_response_time: 50,
        error_rate: 0.1,
        cache_hit_rate: 0.85
      },
      operations: [
        {
          operation: 'get_session',
          avg_duration: 45,
          total_calls: 500,
          error_rate: 0.05
        },
        {
          operation: 'perform_action',
          avg_duration: 120,
          total_calls: 300,
          error_rate: 0.02
        }
      ]
    };
  }

  // Game Session endpoints
  async createSession(data: CreateSessionRequest): Promise<{ session_id: string }> {
    await this.delay(500);
    return { session_id: 'mock-session-' + Date.now() };
  }

  async getSession(sessionId: string): Promise<{ session: GameSession }> {
    await this.delay(200);
    return { session: this.mockSession };
  }

  async getSessions(): Promise<{ sessions: GameSession[] }> {
    await this.delay(300);
    return { sessions: [this.mockSession] };
  }

  async performAction(sessionId: string, action: string): Promise<ActionResult> {
    await this.delay(800);
    return {
      success: true,
      action_result: {
        player_action: {
          id: 'story-' + Date.now(),
          type: 'player',
          text: action,
          timestamp: new Date().toISOString(),
          metadata: {}
        },
        ai_response: {
          id: 'story-' + (Date.now() + 1),
          type: 'narration',
          text: `You ${action}. The world responds to your choice...`,
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      },
      updated_session: this.mockSession,
      world_changes: {
        current_location: this.mockSession.world_state.current_location
      }
    };
  }

  async saveSession(sessionId: string, sessionData: Partial<GameSession>): Promise<{ success: boolean }> {
    await this.delay(300);
    return { success: true };
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    await this.delay(200);
    return { success: true };
  }

  // Lorebook endpoints
  async getLorebooks(filters?: LorebookFilters): Promise<{ lorebooks: Lorebook[] }> {
    await this.delay(200);
    return { lorebooks: this.mockLorebooks };
  }

  async getLorebookDetails(lorebookId: string): Promise<{ lorebook: Lorebook }> {
    await this.delay(150);
    return { lorebook: this.mockLorebooks[0] };
  }

  async deleteLorebook(lorebookId: string): Promise<{ success: boolean }> {
    await this.delay(200);
    return { success: true };
  }

  // Scenario endpoints
  async getScenarios(filters?: ScenarioFilters): Promise<{ templates: ScenarioTemplate[] }> {
    await this.delay(200);
    return { templates: this.mockScenarios };
  }

  async startScenarioGeneration(request: GenerationRequest): Promise<{ task_id: string; status: string; message: string }> {
    await this.delay(500);
    return { 
      task_id: 'mock-task-' + Date.now(), 
      status: 'running', 
      message: 'Scenario generation started' 
    };
  }

  async getGenerationStatus(taskId: string): Promise<GenerationTask> {
    await this.delay(100);
    return {
      task_id: taskId,
      status: 'completed',
      progress: 100,
      result: this.mockScenarios[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // AI Service endpoints
  async generateAIResponse(context: any, action: string): Promise<{ success: boolean; response: any; cached: boolean }> {
    await this.delay(1000);
    return {
      success: true,
      response: {
        narrative: `The AI responds to your action: ${action}`,
        world_changes: {},
        character_updates: {}
      },
      cached: false
    };
  }

  async validateAction(action: string, gameState: any): Promise<{ success: boolean; action: string; is_valid: boolean; validation_details: any }> {
    await this.delay(200);
    return {
      success: true,
      action,
      is_valid: true,
      validation_details: { reason: 'Action is valid in current context' }
    };
  }

  // Utility methods
  async ping(): Promise<{ success: boolean; timestamp: string }> {
    await this.delay(50);
    return { success: true, timestamp: new Date().toISOString() };
  }

  async testConnection(): Promise<boolean> {
    await this.delay(100);
    return true;
  }

  // Configuration methods (no-op for mock)
  updateConfig(newConfig: any): void {
    // No-op for mock client
  }

  getConfig(): any {
    return {
      baseURL: 'mock://localhost',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  createCancelToken() {
    return { token: 'mock-token', cancel: () => {} };
  }

  isRequestCancelled(error: any): boolean {
    return false;
  }
}

// Create and export a singleton instance
export const mockGameAPI = new MockAPIClient();
