import { MessageSquare, Workflow, Bot, Settings, Zap, HandHeart, Ticket, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

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

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
  const [isTicketsExpanded, setIsTicketsExpanded] = useState(true);
  const [chats, setChats] = useState<ChatSession[]>([]);

  useEffect(() => {
    // Connect to WebSocket as admin
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
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const navItems = [
    { icon: MessageSquare, label: 'Chatbot', path: '/chatbot' },
    { icon: Workflow, label: 'Workflows', path: '/workflows' },
    { icon: HandHeart, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: Zap, label: 'AI Agent', path: '/ai-agent' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleTicketClick = (ticketId: string) => {
    const currentPath = location.pathname;
    
    // If already on AI Assistant or AI Agent, dispatch event to append ticket
    if (currentPath === '/ai-assistant' || currentPath === '/ai-agent') {
      window.dispatchEvent(new CustomEvent('appendTicket', { detail: { ticketId } }));
    } else {
      // Navigate to AI Assistant and populate input
      navigate('/ai-assistant', { state: { ticketId } });
    }
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-slate-800">
        <h1 className="font-bold text-xl">AI Platform</h1>
        <p className="text-sm text-slate-400 mt-1">Enterprise Solution</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Recent Tickets Section */}
      <div className="p-4 border-t border-slate-800 max-h-80 overflow-y-auto">
        <button
          onClick={() => setIsTicketsExpanded(!isTicketsExpanded)}
          className="flex items-center justify-between w-full px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors mb-2"
        >
          <div className="flex items-center gap-2">
            <Ticket size={16} />
            <span className="text-sm font-medium">Recent Tickets</span>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${
              isTicketsExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {isTicketsExpanded && (
          <div className="space-y-1">
            {chats.map((chat) => {
              const isHovered = hoveredTicket === chat.id;
              const timeAgo = getTimeAgo(chat.lastMessageTime);
              const isUrgent = chat.reason === 'complain';
              const lastMessage = chat.messages[chat.messages.length - 1]?.text || 'No messages yet';

              return (
                <div
                  key={chat.id}
                  onClick={() => handleTicketClick(chat.id)}
                  onMouseEnter={() => setHoveredTicket(chat.id)}
                  onMouseLeave={() => setHoveredTicket(null)}
                  className="px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-800"
                >
                  {/* Compact View */}
                  {!isHovered && (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">{chat.id}</span>
                        {isUrgent && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 truncate">{chat.customerEmail}</p>
                    </div>
                  )}

                  {/* Expanded View on Hover */}
                  {isHovered && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">{chat.id}</span>
                        {isUrgent && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-medium rounded">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{chat.customerEmail}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span>{chat.messages.length} msgs</span>
                        <span>•</span>
                        <span className={isUrgent ? 'text-red-400' : ''}>{timeAgo}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 bg-slate-800 rounded-lg">
          <p className="text-sm font-medium">Your Company</p>
          <p className="text-xs text-slate-400 mt-1">Premium Plan</p>
        </div>
      </div>
    </div>
  );
}