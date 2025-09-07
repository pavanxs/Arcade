# WebSocket Chat Server

A simple WebSocket server for the chat application using the `ws` library.

## Features

- Room-based chat system
- Real-time messaging
- User connection tracking
- Message history (last 100 messages per room)
- Automatic cleanup of empty rooms

## Installation

```bash
cd ws-server
npm install
```

## Usage

### Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start
```

The server will run on port 8080 by default.

## API

### Connection
```
ws://localhost:8080/ws?room=<roomId>&username=<username>
```

### Message Types

#### Send Messages
```json
{
  "type": "message",
  "content": "Hello world!",
  "sender": "username",
  "roomId": "room123",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Receive Messages
- `message`: New chat message
- `userCount`: Number of users in room
- `history`: Message history when connecting
- `error`: Error messages

## Running Both Servers

To run both the Next.js app and WebSocket server simultaneously:

### Option 1: Separate terminals
```bash
# Terminal 1 - Next.js app
npm run dev

# Terminal 2 - WebSocket server
cd ws-server && npm run dev
```

### Option 2: Using concurrently (if installed)
Add to root package.json:
```json
{
  "scripts": {
    "dev:full": "concurrently \"npm run dev\" \"npm run ws-server\""
  }
}
```

## CORS

Since this is a WebSocket server, CORS is not applicable. Make sure your client connects from allowed origins in production.

