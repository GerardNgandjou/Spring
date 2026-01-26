import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Définir global pour le navigateur
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

// Déclarer global pour TypeScript
declare global {
  interface Window {
    global: typeof globalThis;
  }
}

class WebSocketService {
  private client: Client | null = null;
  private token: string | null = null;
  private roomId: number | null = null;

  connect(token: string, roomId: number, onMessage: (message: any) => void) {
    this.token = token;
    this.roomId = roomId;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws-chat`;
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('WebSocket connected to room:', roomId);
        
        // S'abonner aux messages du salon
        this.client?.subscribe(`/topic/room/${roomId}`, (message) => {
          onMessage(JSON.parse(message.body));
        });
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      }
    });

    this.client.activate();
  }

  sendMessage(content: string) {
    if (this.client?.connected && this.roomId) {
      this.client.publish({
        destination: `/app/chat.sendMessage/${this.roomId}`,
        body: JSON.stringify({ content, chatRoomId: this.roomId }),
        headers: { Authorization: `Bearer ${this.token}` }
      });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.roomId = null;
      console.log('WebSocket disconnected');
    }
  }
}

export const webSocketService = new WebSocketService();