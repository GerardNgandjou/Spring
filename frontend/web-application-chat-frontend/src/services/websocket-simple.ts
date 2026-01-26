// Service WebSocket simplifié sans dépendance à @stomp/stompjs
class SimpleWebSocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private roomId: number | null = null;

  connect(token: string, roomId: number, onMessage: (message: any) => void) {
    this.token = token;
    this.roomId = roomId;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws-chat`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        // Envoyer le token d'authentification
        this.send({ type: 'AUTH', token });
        this.send({ type: 'JOIN_ROOM', roomId });
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  private send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  sendMessage(content: string) {
    if (this.roomId) {
      this.send({
        type: 'SEND_MESSAGE',
        content,
        chatRoomId: this.roomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.roomId = null;
    }
  }
}

export const webSocketService = new SimpleWebSocketService();