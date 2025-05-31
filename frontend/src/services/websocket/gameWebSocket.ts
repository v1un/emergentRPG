// WebSocket Service for Real-time Game Communication

import {
  WebSocketCallbacks,
  ConnectionStatus,
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
      // Note: Removed beforeunload listener as it interferes with SPA navigation
      // WebSocket cleanup is now handled by React component lifecycle
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
    const baseURL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8001';
    const wsURL = baseURL.replace(/^http/, 'ws');
    const fullURL = `${wsURL}${API_ENDPOINTS.WS_GAME(sessionId)}`;
    console.log('GameWebSocket: Constructing WebSocket URL', {
      baseURL,
      wsURL,
      endpoint: API_ENDPOINTS.WS_GAME(sessionId),
      fullURL
    });
    return fullURL;
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

      // If already connected, resolve immediately
      if (this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout

      // Use a one-time event listener instead of overwriting handlers
      const handleOpen = () => {
        clearTimeout(timeout);
        this.ws?.removeEventListener('open', handleOpen);
        this.ws?.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = (error: Event) => {
        clearTimeout(timeout);
        this.ws?.removeEventListener('open', handleOpen);
        this.ws?.removeEventListener('error', handleError);
        reject(new Error('WebSocket connection error'));
      };

      this.ws.addEventListener('open', handleOpen);
      this.ws.addEventListener('error', handleError);
    });
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connection established, waiting for server confirmation...');
      // Don't set to 'connected' immediately - wait for server confirmation message
      this.reconnectAttempts = 0;
      this.isReconnecting = false;

      // Send initial connection message to server
      this.sendMessage({
        type: WEBSOCKET_MESSAGE_TYPES.CONNECTION,
        data: { 
          session_id: this.sessionId,
          client_info: {
            timestamp: Date.now(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          }
        }
      });

      // Send queued messages
      this.sendQueuedMessages();

      // Note: onConnect callback will be triggered when server sends connection confirmation
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
    console.debug('Received WebSocket message:', message.type, message.data);

    try {
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
          console.log('Connection confirmation received from server:', message.data);
          // Confirm connection status when server sends confirmation
          if (message.data?.status === 'connected') {
            console.log('Server confirmed connection - updating status to connected');
            const wasConnecting = this.connectionStatus === 'connecting';
            this.setConnectionStatus('connected');

            // Start ping interval now that connection is confirmed
            this.startPingInterval();

            // Only trigger onConnect callback if we were in connecting state
            if (wasConnecting) {
              console.log('Triggering onConnect callback after server confirmation');
              this.callbacks.onConnect?.();
            }
          }
          break;

      case WEBSOCKET_MESSAGE_TYPES.PONG:
        console.debug('Received pong');
        break;

      case 'action_response':
        console.debug('Received action response:', message.data);
        // Handle action response from server
        break;

      case WEBSOCKET_MESSAGE_TYPES.ERROR:
        console.error('Server error:', message.data);
        this.callbacks.onError?.(new Error(message.data.message ?? 'Server error'));
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error('Error processing message'));
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
          // Use setTimeout to avoid recursive call stack and check if still needed
          setTimeout(() => {
            // Only reconnect if we're still disconnected and have a session
            if (this.sessionId && this.connectionStatus !== 'connected' && !this.isReconnecting) {
              this.attemptReconnect();
            }
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
    // Ensure message has required fields
    if (!message.type) {
      console.error('Cannot send message without type:', message);
      return;
    }
    
    // Add timestamp and session ID if not present
    const enhancedMessage = {
      ...message,
      timestamp: message.timestamp || Date.now(),
      session_id: message.session_id || this.sessionId
    };
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(enhancedMessage));
        console.debug('Sent WebSocket message:', enhancedMessage.type);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.messageQueue.push(enhancedMessage);
      }
    } else {
      console.warn('WebSocket not connected, queueing message');
      this.messageQueue.push(enhancedMessage);
    }
  }

  sendAction(action: string): void {
    if (!action || typeof action !== 'string') {
      console.error('Invalid action provided to sendAction:', action);
      return;
    }
    
    this.sendMessage({
      type: WEBSOCKET_MESSAGE_TYPES.ACTION,
      data: { 
        action,
        timestamp: Date.now(),
        session_id: this.sessionId
      }
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
