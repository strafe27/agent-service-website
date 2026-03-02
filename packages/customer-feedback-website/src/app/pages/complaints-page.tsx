import { useState, useEffect, FormEvent, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { LogOut, Send, MessageSquare, ThumbsUp, AlertCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: string;
}

type Reason = "feedback" | "complain" | "other" | null;

export function ComplaintsPage() {
  const [reason, setReason] = useState<Reason>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const email = localStorage.getItem("userEmail");
    
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    setUserEmail(email || "");

    // Connect to WebSocket
    const socket = new WebSocket(`ws://localhost:8081/ws?role=customer&email=${email}`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_started') {
        setChatId(data.chatId);
      } else if (data.type === 'message') {
        const agentMessage: Message = {
          id: data.message.id,
          text: data.message.text,
          sender: "agent",
          timestamp: data.message.timestamp
        };
        setMessages(prev => [...prev, agentMessage]);
        setIsTyping(false);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    ws?.close();
    navigate("/");
  };

  const handleReasonSelect = (selectedReason: Reason) => {
    setReason(selectedReason);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'start_chat',
        reason: selectedReason
      }));
    }

    // Add local welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Thank you for contacting us regarding ${selectedReason}. An agent will be with you shortly. How can we help you today?`,
      sender: "agent",
      timestamp: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !ws || !chatId) {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: "user",
      timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify({
      action: 'send_message',
      chatId: chatId,
      text: message.trim()
    }));

    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getReasonIcon = (reasonType: string) => {
    switch (reasonType) {
      case "feedback":
        return <ThumbsUp className="w-6 h-6" />;
      case "complain":
        return <AlertCircle className="w-6 h-6" />;
      case "other":
        return <HelpCircle className="w-6 h-6" />;
      default:
        return <MessageSquare className="w-6 h-6" />;
    }
  };

  const getReasonColor = (reasonType: string) => {
    switch (reasonType) {
      case "feedback":
        return "bg-green-500 hover:bg-green-600";
      case "complain":
        return "bg-red-500 hover:bg-red-600";
      case "other":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold">Customer Support Chat</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {!reason ? (
          /* Reason Selection */
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Welcome to Customer Support</CardTitle>
              <CardDescription>
                Please select a reason to connect with an agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <button
                  onClick={() => handleReasonSelect("feedback")}
                  className={`${getReasonColor("feedback")} text-white p-6 rounded-lg transition-all hover:scale-105 flex items-center gap-4`}
                >
                  <div className="bg-white/20 p-3 rounded-full">
                    {getReasonIcon("feedback")}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Feedback</h3>
                    <p className="text-sm opacity-90">Share your thoughts and suggestions</p>
                  </div>
                </button>

                <button
                  onClick={() => handleReasonSelect("complain")}
                  className={`${getReasonColor("complain")} text-white p-6 rounded-lg transition-all hover:scale-105 flex items-center gap-4`}
                >
                  <div className="bg-white/20 p-3 rounded-full">
                    {getReasonIcon("complain")}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Complain</h3>
                    <p className="text-sm opacity-90">Report an issue or problem</p>
                  </div>
                </button>

                <button
                  onClick={() => handleReasonSelect("other")}
                  className={`${getReasonColor("other")} text-white p-6 rounded-lg transition-all hover:scale-105 flex items-center gap-4`}
                >
                  <div className="bg-white/20 p-3 rounded-full">
                    {getReasonIcon("other")}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Other</h3>
                    <p className="text-sm opacity-90">General inquiries and questions</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Chat Interface */
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Chat with Support
                      <Badge variant="outline" className="capitalize">
                        {reason}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Connected to customer support
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setReason(null);
                      setMessages([]);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    New Chat
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-gray-200 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === "user" ? "text-indigo-200" : "text-gray-500"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!message.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}