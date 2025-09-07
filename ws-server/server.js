const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = 8080;

// Store active connections by room
const rooms = new Map();
// Store message history per room (in production, use a database)
const messageHistory = new Map();

const server = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

server.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('room');
  const username = url.searchParams.get('username');

  if (!roomId || !username) {
    ws.close(1008, 'Missing room or username parameters');
    return;
  }

  console.log(`${username} connected to room ${roomId}`);

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    messageHistory.set(roomId, []);
  }

  const room = rooms.get(roomId);
  room.add(ws);

  // Send user count update
  broadcastToRoom(roomId, {
    type: 'userCount',
    count: room.size
  });

  // Send message history
  const history = messageHistory.get(roomId);
  if (history.length > 0) {
    ws.send(JSON.stringify({
      type: 'history',
      messages: history.slice(-50) // Send last 50 messages
    }));
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'message') {
        const chatMessage = {
          id: uuidv4(),
          content: message.content,
          sender: username,
          timestamp: new Date().toISOString(),
          roomId: roomId
        };

        // Store in history
        const history = messageHistory.get(roomId);
        history.push(chatMessage);

        // Keep only last 100 messages per room
        if (history.length > 100) {
          history.shift();
        }

        // Broadcast to all users in the room
        broadcastToRoom(roomId, {
          type: 'message',
          ...chatMessage
        });

        console.log(`Message from ${username} in room ${roomId}: ${message.content}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`${username} disconnected from room ${roomId}`);

    const room = rooms.get(roomId);
    if (room) {
      room.delete(ws);

      // Send updated user count
      broadcastToRoom(roomId, {
        type: 'userCount',
        count: room.size
      });

      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomId);
        messageHistory.delete(roomId);
        console.log(`Room ${roomId} cleaned up`);
      }
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${username}:`, error);
  });
});

function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (room) {
    room.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

