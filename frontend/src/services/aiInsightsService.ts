// AI Insights Service - Manages AI decision insights and explanations

import React from 'react';
import { AIInsight, AIDecisionFactor } from '@/components/ui/AIInsightsPanel';

export class AIInsightsService {
  private insights: AIInsight[] = [];
  private maxInsights = 100; // Keep last 100 insights
  private listeners: ((insights: AIInsight[]) => void)[] = [];

  // Subscribe to insights updates
  subscribe(listener: (insights: AIInsight[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of updates
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.insights]));
  }

  // Add a new insight
  addInsight(insight: AIInsight): void {
    this.insights.unshift(insight);
    
    // Keep only the most recent insights
    if (this.insights.length > this.maxInsights) {
      this.insights = this.insights.slice(0, this.maxInsights);
    }
    
    this.notifyListeners();
  }

  // Get all insights
  getInsights(): AIInsight[] {
    return [...this.insights];
  }

  // Get insights by type
  getInsightsByType(type: string): AIInsight[] {
    return this.insights.filter(insight => insight.decision_type === type);
  }

  // Get recent insights (last N)
  getRecentInsights(count: number = 10): AIInsight[] {
    return this.insights.slice(0, count);
  }

  // Clear all insights
  clearInsights(): void {
    this.insights = [];
    this.notifyListeners();
  }

  // Generate mock insight for testing/demo purposes
  generateMockInsight(type: string = 'narrative'): AIInsight {
    const mockFactors: AIDecisionFactor[] = [
      {
        category: 'character',
        factor: 'Character motivation alignment',
        influence: 0.85,
        explanation: 'The character\'s established goals strongly support this narrative direction.',
        evidence: [
          'Character previously expressed desire for adventure',
          'Recent actions show growing confidence',
          'Backstory includes similar experiences'
        ]
      },
      {
        category: 'story',
        factor: 'Narrative tension',
        influence: 0.72,
        explanation: 'This choice maintains optimal story pacing and dramatic tension.',
        evidence: [
          'Previous scene ended on cliffhanger',
          'Story arc requires escalation at this point',
          'Reader engagement metrics suggest need for action'
        ]
      },
      {
        category: 'world',
        factor: 'World consistency',
        influence: 0.68,
        explanation: 'The decision aligns with established world rules and lore.',
        evidence: [
          'Magic system supports this outcome',
          'Political situation makes this plausible',
          'Geographic constraints considered'
        ]
      },
      {
        category: 'player',
        factor: 'Player preferences',
        influence: 0.45,
        explanation: 'Based on previous choices, player seems to prefer diplomatic solutions.',
        evidence: [
          'Player chose negotiation in 3 of last 5 conflicts',
          'Character build focuses on social skills',
          'Previous feedback indicated preference for roleplay'
        ]
      }
    ];

    const mockAlternatives = [
      {
        option: 'Direct confrontation approach',
        reason_rejected: 'Would contradict character\'s established diplomatic nature and current story tone',
        confidence: 0.23
      },
      {
        option: 'Avoidance strategy',
        reason_rejected: 'Would stall narrative progression and reduce dramatic tension',
        confidence: 0.31
      }
    ];

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      decision_type: type as any,
      confidence: 0.78,
      reasoning: 'The AI chose this narrative direction by weighing character consistency, story pacing, and world logic. The character\'s diplomatic nature and the current story tension point toward a negotiation scene that will advance the plot while staying true to established character traits.',
      factors: mockFactors,
      alternatives_considered: mockAlternatives,
      context_used: {
        recent_story: [
          'Player entered the tavern cautiously',
          'Mysterious figure approached with urgent news',
          'Tension rose as guards entered',
          'Player showed interest in peaceful resolution'
        ],
        character_state: {
          level: 5,
          diplomacy_skill: 18,
          reputation: 'Peacemaker',
          current_hp: 45,
          stress_level: 'moderate'
        },
        world_state: {
          political_tension: 'high',
          tavern_atmosphere: 'tense',
          guard_alertness: 'elevated',
          time_of_day: 'evening',
          weather: 'stormy'
        },
        player_preferences: {
          roleplay_focus: 0.8,
          combat_preference: 0.3,
          exploration_interest: 0.6,
          story_engagement: 0.9
        }
      },
      processing_time_ms: 245,
      model_version: 'GPT-4-Turbo-2024'
    };
  }

  // Parse AI response to extract insights
  parseAIResponse(response: any): AIInsight | null {
    try {
      // This would typically parse the actual AI response
      // For now, we'll create insights based on response metadata
      if (!response.metadata?.ai_decision_info) {
        return null;
      }

      const decisionInfo = response.metadata.ai_decision_info;
      
      return {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        decision_type: decisionInfo.type || 'narrative',
        confidence: decisionInfo.confidence || 0.5,
        reasoning: decisionInfo.reasoning || 'AI made this decision based on available context.',
        factors: decisionInfo.factors || [],
        alternatives_considered: decisionInfo.alternatives || [],
        context_used: {
          recent_story: decisionInfo.context?.recent_story || [],
          character_state: decisionInfo.context?.character_state || {},
          world_state: decisionInfo.context?.world_state || {},
          player_preferences: decisionInfo.context?.player_preferences || {}
        },
        processing_time_ms: decisionInfo.processing_time_ms,
        model_version: decisionInfo.model_version
      };
    } catch (error) {
      console.error('Failed to parse AI response for insights:', error);
      return null;
    }
  }

  // Get insights statistics
  getInsightsStats(): {
    total: number;
    byType: Record<string, number>;
    averageConfidence: number;
    averageProcessingTime: number;
  } {
    const total = this.insights.length;
    const byType: Record<string, number> = {};
    let totalConfidence = 0;
    let totalProcessingTime = 0;
    let processedCount = 0;

    this.insights.forEach(insight => {
      byType[insight.decision_type] = (byType[insight.decision_type] || 0) + 1;
      totalConfidence += insight.confidence;
      
      if (insight.processing_time_ms) {
        totalProcessingTime += insight.processing_time_ms;
        processedCount++;
      }
    });

    return {
      total,
      byType,
      averageConfidence: total > 0 ? totalConfidence / total : 0,
      averageProcessingTime: processedCount > 0 ? totalProcessingTime / processedCount : 0
    };
  }

  // Export insights for analysis
  exportInsights(): string {
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      insights: this.insights,
      stats: this.getInsightsStats()
    }, null, 2);
  }

  // Import insights from exported data
  importInsights(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.insights && Array.isArray(parsed.insights)) {
        this.insights = parsed.insights;
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import insights:', error);
      return false;
    }
  }
}

// Singleton instance
export const aiInsightsService = new AIInsightsService();

// React hook for using AI insights
export function useAIInsights() {
  const [insights, setInsights] = React.useState<AIInsight[]>([]);

  React.useEffect(() => {
    // Get initial insights
    setInsights(aiInsightsService.getInsights());

    // Subscribe to updates
    const unsubscribe = aiInsightsService.subscribe(setInsights);

    return unsubscribe;
  }, []);

  return {
    insights,
    addInsight: (insight: AIInsight) => aiInsightsService.addInsight(insight),
    getInsightsByType: (type: string) => aiInsightsService.getInsightsByType(type),
    getRecentInsights: (count?: number) => aiInsightsService.getRecentInsights(count),
    clearInsights: () => aiInsightsService.clearInsights(),
    generateMockInsight: (type?: string) => aiInsightsService.generateMockInsight(type),
    stats: aiInsightsService.getInsightsStats()
  };
}

export default aiInsightsService;
