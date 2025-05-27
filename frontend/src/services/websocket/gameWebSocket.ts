// WebSocket Service for Real-time Game Communication

import { 
  WebSocketCallbacks, 
  ConnectionStatus, 
  GameMessage, 
  WebSocketMessage 
} from '@/types';
import { 
  WEBSOCKET_MESSAGE_TYPES, 
  DEFAULT_VALUES, 
  API_ENDPOINTS 
} from '@/utils/constants';
import { sleep } from '@/utils/helpers';

export class GameWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number = DEFAULT_VALUES.WS_RECONNECT_ATTEMPTS;
  private reconnectDelay: number = DEFAULT_VALUES.WS_RECONNECT_DELAY;
  private pingInterval: NodeJS.Timeout | null = null;
  private callbacks: WebSocketCallbacks = {};
  private connectionStatus: ConnectionStatus = 'disconnected';
  private sessionId: string | null = null;
  private messageQueue: any[] = [];
  private isReconnecting = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      window.addEventListener('beforeunload', this.disconnect.bind(this));
    }
  }

  private handleOnline(): void {
    console.log('Network connection restored');
    if (this.sessionId && this.connectionStatus === 'disconnected') {
      this.reconnect();
    }
  }

  private handleOffline(): void {
    console.log('Network connection lost');
    this.setConnectionStatus('disconnected');
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    console.debug(`WebSocket connection status: ${status}`);
  }

  private getWebSocketURL(sessionId: string): string {
    const baseURL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';
    const wsURL = baseURL.replace(/^http/, 'ws');
    return `${wsURL}${API_ENDPOINTS.WS_GAME(sessionId)}`;
  }

  async connect(sessionId: string, callbacks: WebSocketCallbacks): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionStatus === 'connecting') {
      console.log('WebSocket connection already in progress');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId === sessionId) {
      console.log('WebSocket already connected to session:', sessionId);
      return;
    }

    // Close existing connection if different session
    if (this.ws && this.sessionId !== sessionId) {
      console.log('Closing existing WebSocket connection for new session');
      this.disconnect();
    }

    this.sessionId = sessionId;
    this.callbacks = callbacks;
    this.setConnectionStatus('connecting');

    try {
      const wsURL = this.getWebSocketURL(sessionId);
      console.log('Connecting to WebSocket:', wsURL);

      this.ws = new WebSocket(wsURL);
      this.setupWebSocketHandlers();

      // Wait for connection to be established
      await this.waitForConnection();

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.setConnectionStatus('error');
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout

      this.ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      
      // Start ping interval
      this.startPingInterval();
      
      // Send queued messages
      this.sendQueuedMessages();
      
      // Notify callback
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      this.setConnectionStatus('disconnected');
      this.stopPingInterval();
      
      // Notify callback
      this.callbacks.onDisconnect?.();
      
      // Attempt reconnection if not intentional
      if (!event.wasClean && !this.isReconnecting) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.setConnectionStatus('error');
      this.callbacks.onError?.(new Error('WebSocket connection error'));
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    console.debug('Received WebSocket message:', message.type);

    switch (message.type) {
      case WEBSOCKET_MESSAGE_TYPES.NARRATIVE_RESPONSE:
        this.callbacks.onNarrativeUpdate?.(message.data);
        break;
      
      case WEBSOCKET_MESSAGE_TYPES.WORLD_CHANGE:
        this.callbacks.onWorldUpdate?.(message.data);
        break;
      
      case WEBSOCKET_MESSAGE_TYPES.CHARACTER_UPDATE:
        this.callbacks.onCharacterUpdate?.(message.data);
        break;
      
      case WEBSOCKET_MESSAGE_TYPES.QUEST_UPDATE:
        this.callbacks.onQuestUpdate?.(message.data);
        break;
      
      case WEBSOCKET_MESSAGE_TYPES.CONNECTION:
        console.log('Connection message:', message.data);
        break;
      
      case WEBSOCKET_MESSAGE_TYPES.PONG:
        console.debug('Received pong');
        break;
      
      case WEBSOCKET_MESSAGE_TYPES.ERROR:
        console.error('Server error:', message.data);
        this.callbacks.onError?.(new Error(message.data.message || 'Server error'));
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, DEFAULT_VALUES.WS_PING_INTERVAL);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: WEBSOCKET_MESSAGE_TYPES.PING,
        data: { timestamp: Date.now() }
      });
    }
  }

  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setConnectionStatus('error');
      this.isReconnecting = false;
      return;
    }

    if (this.isReconnecting) {
      console.log('Reconnection already in progress');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    await sleep(delay);

    if (this.sessionId && this.isReconnecting) {
      try {
        await this.connect(this.sessionId, this.callbacks);
        this.isReconnecting = false;
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.isReconnecting = false;

        // Only attempt another reconnection if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          // Use setTimeout to avoid recursive call stack
          setTimeout(() => {
            this.attemptReconnect();
          }, 1000);
        } else {
          this.setConnectionStatus('error');
        }
      }
    } else {
      this.isReconnecting = false;
    }
  }

  private reconnect(): void {
    if (this.sessionId && !this.isReconnecting) {
      this.attemptReconnect();
    }
  }

  sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.debug('Sent WebSocket message:', message.type);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.messageQueue.push(message);
      }
    } else {
      console.warn('WebSocket not connected, queueing message');
      this.messageQueue.push(message);
    }
  }

  sendAction(action: string): void {
    this.sendMessage({
      type: WEBSOCKET_MESSAGE_TYPES.ACTION,
      data: { action }
    });
  }

  disconnect(): void {
    console.log('Disconnecting WebSocket');
    this.isReconnecting = false;
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionStatus('disconnected');
    this.sessionId = null;
    this.callbacks = {};
    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  // Getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  // Configuration
  setMaxReconnectAttempts(attempts: number): void {
    this.maxReconnectAttempts = attempts;
  }

  setReconnectDelay(delay: number): void {
    this.reconnectDelay = delay;
  }
}

// Create and export singleton instance
export const gameWebSocket = new GameWebSocketService();

// Export the class for custom instances
export default GameWebSocketService;
