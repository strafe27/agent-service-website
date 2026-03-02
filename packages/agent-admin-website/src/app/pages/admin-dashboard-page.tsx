import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { LogOut, Send, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "customer" | "admin";
  timestamp: string;
}

interface ChatSession {
  id: string;
  customerEmail: string;
  reason: "feedback" | "complain" | "other";
  messages: Message[];
  status: "active" | "closed";
  lastMessageTime: string;
}

const mockChats: ChatSession[] = [
  {
    id: "1",
    customerEmail: "john@example.com",
    reason: "complain",
    messages: [
      {
        id: "1",
        text: "Your service is terrible! I've been waiting for 3 days!",
        sender: "customer",
        timestamp: new Date().toISOString()
      }
    ],
    status: "active",
    lastMessageTime: new Date().toISOString()
  },
  {
    id: "2",
    customerEmail: "sarah@example.com",
    reason: "feedback",
    messages: [
      {
        id: "1",
        text: "I really love your product! Just wanted to say thanks.",
        sender: "customer",
        timestamp: new Date(Date.now() - 300000).toISOString()
      }
    ],
    status: "active",
    lastMessageTime: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "3",
    customerEmail: "mike@example.com",
    reason: "other",
    messages: [
      {
        id: "1",
        text: "Can you help me understand how to use feature X?",
        sender: "customer",
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ],
    status: "active",
    lastMessageTime: new Date(Date.now() - 600000).toISOString()
  }
];

export function AdminDashboardPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAdminAuthenticated");
    const email = localStorage.getItem("adminEmail");
    
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }
    
    setAdminEmail(email || "");

    // Connect to WebSocket
    const socket = new WebSocket(`ws://localhost:8081/ws?role=admin`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setChats(data.chats);
      } else if (data.type === 'new_chat') {
        setChats(prev => [...prev, data.chat]);
      } else if (data.type === 'message') {
        const { chatId, message: newMsg } = data;
        setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, newMsg],
              lastMessageTime: newMsg.timestamp
            };
          }
          return chat;
        }));

        setSelectedChat(prev => {
          if (prev && prev.id === chatId) {
            return {
              ...prev,
              messages: [...prev.messages, newMsg],
              lastMessageTime: newMsg.timestamp
            };
          }
          return prev;
        });
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminEmail");
    ws?.close();
    navigate("/admin");
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat || !ws) {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: "admin",
      timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify({
      action: 'send_message',
      chatId: selectedChat.id,
      text: message.trim()
    }));

    // Update the chat with the new message locally for immediate feedback
    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChat.id) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessageTime: newMessage.timestamp
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage]
    });
    setMessage("");
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "feedback":
        return "bg-green-100 text-green-800";
      case "complain":
        return "bg-red-100 text-red-800";
      case "other":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage customer support chats</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">{chats.filter(c => c.status === "active").length} Active Chats</Badge>
            <span className="text-sm text-gray-600">{adminEmail}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4">Customer Chats</h2>
            <div className="space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedChat?.id === chat.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{chat.customerEmail}</span>
                    </div>
                    <Badge className={`text-xs ${getReasonColor(chat.reason)}`}>
                      {chat.reason}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.messages[chat.messages.length - 1]?.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(chat.lastMessageTime)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedChat.customerEmail}</h3>
                    <p className="text-sm text-gray-500 capitalize">Reason: {selectedChat.reason}</p>
                  </div>
                  <Badge variant={selectedChat.status === "active" ? "default" : "secondary"}>
                    {selectedChat.status}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender === "admin"
                          ? "bg-purple-600 text-white rounded-br-sm"
                          : "bg-gray-200 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === "admin" ? "text-purple-200" : "text-gray-500"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your response..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!message.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  💡 This is where you'll integrate WebSocket to send/receive real-time messages
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a chat to start responding</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
