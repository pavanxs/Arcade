'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: Date
  roomId: string
}

// Color palette for usernames (hex colors)
const USER_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#db2777', // pink-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#0891b2'  // cyan-600
]

// Function to get consistent color for a username
const getUserColor = (username: string) => {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % USER_COLORS.length
  const selectedColor = USER_COLORS[colorIndex]
  console.log(`User: ${username}, Color: ${selectedColor}`)
  return selectedColor
}

export default function ChatRoom() {
  const params = useParams()
  const roomId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate a random username for demo purposes
    const randomUsername = `User${Math.floor(Math.random() * 1000)}`
    setUsername(randomUsername)

    // Initialize WebSocket connection
    const connectWebSocket = () => {
      // Replace with your actual WebSocket server URL
      const ws = new WebSocket(`ws://localhost:8080/ws?room=${roomId}&username=${randomUsername}`)

      ws.onopen = () => {
        console.log('Connected to chat room:', roomId)
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'message') {
            const message: Message = {
              id: data.id,
              content: data.content,
              sender: data.sender,
              timestamp: new Date(data.timestamp),
              roomId: data.roomId
            }
            setMessages(prev => [...prev, message])
          } else if (data.type === 'userCount') {
            setUserCount(data.count)
          } else if (data.type === 'history') {
            setMessages(data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })))
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      ws.onclose = () => {
        console.log('Disconnected from chat room')
        setIsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current = ws
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [roomId])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnected) return

    const message = {
      type: 'message',
      content: newMessage.trim(),
      sender: username,
      roomId: roomId,
      timestamp: new Date().toISOString()
    }

    wsRef.current.send(JSON.stringify(message))
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-600 dark:text-red-400">
          Chat Room: {roomId}
        </h1>
        <Card className="h-[80vh] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {userCount} users online
              </Badge>
              <Avatar className="w-8 h-8">
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{username}</span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 h-full" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender === username ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender !== username && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {message.sender.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        message.sender === username
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium"
                          style={{ color: message.sender === username ? 'inherit' : getUserColor(message.sender) }}
                        >
                          {message.sender === username ? 'You' : message.sender}
                        </span>
                        <span className="text-xs opacity-50">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.sender === username && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {message.sender.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t">
            <div className="flex gap-2 w-full">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
              >
                Send
              </Button>
            </div>
            {!isConnected && (
              <p className="text-sm text-muted-foreground mt-2 w-full">
                Connecting to chat server...
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

