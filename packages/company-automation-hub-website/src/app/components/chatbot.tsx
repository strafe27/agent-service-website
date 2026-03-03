import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Plus, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessage?: string;
}

const mockResponses = [
  "I'm here to help! As an AI assistant, I can help you with various tasks. What would you like to know?",
  "That's an interesting question. Let me provide you with some information about that.",
  "I understand. Based on your inquiry, I can suggest several approaches to solve this.",
  "Great! I can help you with that. Here's what I recommend...",
  "Thank you for asking. Let me break this down for you in a clear way.",
];

export function Chatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'General Inquiry',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          sender: 'bot',
          timestamp: new Date(Date.now() - 3600000),
        },
      ],
      createdAt: new Date(Date.now() - 3600000),
      lastMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('Risk Team Chatbot');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const versions = [
    'Risk Team Chatbot',
    'CE Team Chatbot',
    'Sales Team Chatbot',
    'Support Team Chatbot',
  ];

  const currentConversation = conversations.find(c => c.id === currentConversationId) || conversations[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, isTyping]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `Conversation ${conversations.length + 1}`,
      messages: [
        {
          id: Date.now().toString(),
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      lastMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          lastMessage: inputValue,
        };
      }
      return conv;
    }));

    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, botMessage],
            lastMessage: botMessage.text,
          };
        }
        return conv;
      }));
      
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AI Chatbot</h1>
                <p className="text-slate-600 text-sm mt-1">Powered by advanced AI models</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Version:</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {versions.map((version) => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentConversation?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-blue-500' : 'bg-slate-700'
              }`}>
                {message.sender === 'user' ? (
                  <User size={20} className="text-white" />
                ) : (
                  <Bot size={20} className="text-white" />
                )}
              </div>
              <div className={`flex flex-col max-w-2xl ${message.sender === 'user' ? 'items-end' : ''}`}>
                <div className={`rounded-2xl px-5 py-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}>
                  <p>{message.text}</p>
                </div>
                <span className="text-xs text-slate-500 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3">
                <Loader2 size={20} className="text-slate-400 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-slate-200 p-6">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={20} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-slate-200 p-6">
        <h2 className="font-bold text-lg text-slate-900 mb-4">Chatbot Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Model</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>GPT-4 Turbo</option>
              <option>GPT-3.5</option>
              <option>Claude 3</option>
              <option>Custom Model</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="0.7"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Tokens</label>
            <input
              type="number"
              defaultValue="2048"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-900">Conversation History</h3>
              <button
                onClick={createNewConversation}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs flex items-center gap-1"
              >
                <Plus size={14} />
                New
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setCurrentConversationId(conv.id)}
                  className={`w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors border ${
                    conv.id === currentConversationId
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare size={14} className={`mt-0.5 flex-shrink-0 ${
                      conv.id === currentConversationId ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {conv.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}