import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, X, Plus, Zap } from 'lucide-react';
import { useLocation } from 'react-router';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'customer';
  timestamp: Date;
  status?: 'pending' | 'sent';
}

interface TicketData {
  ticketNumber: string;
  issue: string;
  customerMessages: Message[];
  conversationInput: string;
  aiSuggestion: string;
  isAiThinking: boolean;
  suggestionIndex: number;
  isActive: boolean; // Whether autonomous agent is running
}

const mockIssues = [
  'Device Binding Issue',
  'Payment Failed',
  'Account Access Problem',
  'Shipping Delay',
];

const getMockMessages = (ticketNum: string): Message[] => {
  const issues = [
    [
      {
        id: '1',
        text: 'Hi, I\'m having trouble with device binding. My device won\'t connect to my account.',
        sender: 'customer' as const,
        timestamp: new Date(Date.now() - 600000),
      },
      {
        id: '2',
        text: 'I\'ve tried restarting it multiple times but it still shows "binding failed".',
        sender: 'customer' as const,
        timestamp: new Date(Date.now() - 540000),
      },
    ],
    [
      {
        id: '1',
        text: 'My payment keeps getting declined even though I have sufficient funds.',
        sender: 'customer' as const,
        timestamp: new Date(Date.now() - 480000),
      },
    ],
    [
      {
        id: '1',
        text: 'I can\'t log into my account. It says my password is incorrect but I\'m sure it\'s right.',
        sender: 'customer' as const,
        timestamp: new Date(Date.now() - 420000),
      },
    ],
    [
      {
        id: '1',
        text: 'My order was supposed to arrive yesterday but I haven\'t received it yet.',
        sender: 'customer' as const,
        timestamp: new Date(Date.now() - 360000),
      },
    ],
  ];
  
  const hash = ticketNum.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return issues[hash % issues.length];
};

const aiSuggestions = [
  "Thank you for reaching out. I understand you're experiencing issues with device binding. Let me help you resolve this. First, could you please confirm if you've completed the following steps:\n\n1. Ensure your device firmware is up to date\n2. Check if your mobile app is the latest version\n3. Verify that your device is in pairing mode (usually indicated by a blinking LED)\n\nAlso, what error message exactly are you seeing on your screen?",
  
  "I appreciate your patience. Based on the 'binding failed' error, this is typically caused by one of these issues:\n\n1. Network connectivity - Please ensure your WiFi is stable\n2. Account region mismatch - Your device and account should be in the same region\n3. Device cache - Try removing the device from the app completely and re-adding it\n\nCould you try resetting your device to factory settings and attempting the binding process again? Hold the reset button for 10 seconds until you see the LED flash rapidly.",

  "I see this is a persistent issue. Let me escalate this to our technical team for a deeper investigation. In the meantime, could you provide me with:\n\n1. Your device model number (usually found on the back or bottom)\n2. Your account email\n3. A screenshot of the exact error message\n\nThis will help us resolve the issue more quickly. Thank you for your cooperation!",
];

const customerResponses = [
  "Ok, let me check those settings...",
  "I tried that but it's still not working.",
  "Yes, I can see the LED blinking now.",
  "Here's the information you requested.",
  "Thank you so much! That worked!",
  "I'm still having the same issue unfortunately.",
];

function TicketCard({ 
  ticket, 
  onUpdate, 
  onRemove,
  ws,
}: { 
  ticket: TicketData; 
  onUpdate: (updates: Partial<TicketData>) => void;
  onRemove: () => void;
  ws: WebSocket | null;
}) {
  const customerMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    customerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.customerMessages]);

  // Autonomous agent loop
  useEffect(() => {
    if (!ticket.isActive) return;

    // Step 1: AI thinks
    if (!ticket.isAiThinking && !ticket.aiSuggestion) {
      setTimeout(() => {
        onUpdate({ isAiThinking: true });
      }, 1000);
    }

    // Step 2: AI generates suggestion
    if (ticket.isAiThinking && !ticket.aiSuggestion) {
      setTimeout(() => {
        onUpdate({
          aiSuggestion: aiSuggestions[ticket.suggestionIndex % aiSuggestions.length],
          suggestionIndex: ticket.suggestionIndex + 1,
          isAiThinking: false,
        });
      }, 2000);
    }

    // Step 3: Auto-compose and send
    if (ticket.aiSuggestion && !ticket.conversationInput && !ticket.isAiThinking) {
      setTimeout(() => {
        onUpdate({ conversationInput: ticket.aiSuggestion });
        
        // Auto-send immediately after composing
        setTimeout(() => {
          const newMessage: Message = {
            id: Date.now().toString(),
            text: ticket.aiSuggestion,
            sender: 'agent',
            timestamp: new Date(),
            status: 'sent',
          };

          onUpdate({
            customerMessages: [...ticket.customerMessages, newMessage],
            conversationInput: '',
            aiSuggestion: '',
          });

          // Send via WebSocket
          if (ws) {
            ws.send(JSON.stringify({
              action: 'send_message',
              chatId: ticket.ticketNumber,
              text: newMessage.text
            }));
          }
        }, 1000);
      }, 500);
    }
  }, [ticket.isAiThinking, ticket.aiSuggestion, ticket.conversationInput, ticket.isActive]);

  const messageSize = 'text-sm';
  const iconSize = 20;
  const avatarSize = 'w-10 h-10';

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200 mb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Zap size={12} />
            {ticket.ticketNumber}
          </span>
          <span className="text-xs text-slate-600">{ticket.issue}</span>
          {ticket.isActive && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium animate-pulse">
              ● Running
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Conversation with Customer */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0">
          <div className="border-b border-slate-200 p-2 bg-slate-50 flex-shrink-0">
            <h3 className="font-bold text-base text-slate-900">Conversation</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
            {ticket.customerMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.sender === 'agent' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 ${avatarSize} rounded-full flex items-center justify-center ${
                  message.sender === 'customer' ? 'bg-slate-600' : 'bg-yellow-500'
                }`}>
                  {message.sender === 'customer' ? (
                    <User size={iconSize} className="text-white" />
                  ) : (
                    <Zap size={iconSize} className="text-white" />
                  )}
                </div>
                <div className={`flex flex-col max-w-[70%] ${message.sender === 'agent' ? 'items-end' : ''}`}>
                  <div className={`rounded-xl px-3 py-2 ${
                    message.sender === 'customer'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    <p className={`whitespace-pre-wrap ${messageSize}`}>{message.text}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-slate-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.status === 'sent' && (
                      <CheckCircle size={10} className="text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={customerMessagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-2">
            <textarea
              value={ticket.conversationInput}
              readOnly
              placeholder="AI composing message..."
              rows={3}
              className={`w-full px-2 py-2 border border-slate-300 rounded-lg bg-slate-50 resize-none ${messageSize} text-slate-700`}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Zap size={10} className="text-yellow-500" />
                Auto-sending...
              </span>
              <div className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg flex items-center gap-1">
                <Send size={14} />
                Auto
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Thinking */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="border-b border-slate-200 p-2 bg-yellow-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">AI Agent</h3>
              <Sparkles size={iconSize} className="text-yellow-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {ticket.isAiThinking ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 size={40} className="text-yellow-500 animate-spin mb-2" />
                <p className={`${messageSize} text-slate-600`}>AI is thinking...</p>
              </div>
            ) : ticket.aiSuggestion ? (
              <div className="space-y-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-2">
                    <Bot size={iconSize} className="text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Generated Response</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">{ticket.aiSuggestion}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-xs text-green-700">Auto-composing and sending...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Zap size={40} className="mb-2 opacity-50 text-yellow-500" />
                <p className={messageSize}>Waiting for next cycle...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIAgent() {
  const location = useLocation();
  const [selectedVersion, setSelectedVersion] = useState('CE Autonomous Agent');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketInput, setTicketInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8081/ws?role=admin`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setTickets(prev => prev.map(ticket => {
          const chat = data.chats.find((c: any) => c.id === ticket.ticketNumber);
          if (chat) {
            return {
              ...ticket,
              issue: chat.reason,
              customerMessages: chat.messages.map((m: any) => ({
                id: m.id,
                text: m.text,
                sender: m.sender === 'customer' ? 'customer' : 'agent',
                timestamp: new Date(m.timestamp),
                status: m.sender === 'admin' ? 'sent' : undefined
              }))
            };
          }
          return ticket;
        }));
      } else if (data.type === 'message') {
        const { chatId, message: newMsg } = data;
        setTickets(prev => prev.map(ticket => {
          if (ticket.ticketNumber === chatId) {
            if (ticket.customerMessages.some(m => m.id === newMsg.id)) return ticket;
            
            const mappedMsg: Message = {
              id: newMsg.id,
              text: newMsg.text,
              sender: newMsg.sender === 'customer' ? 'customer' : 'agent',
              timestamp: new Date(newMsg.timestamp),
              status: newMsg.sender === 'admin' ? 'sent' : undefined
            };
            return {
              ...ticket,
              customerMessages: [...ticket.customerMessages, mappedMsg]
            };
          }
          return ticket;
        }));
      } else if (data.type === 'chat_history') {
        const { chatId, chat } = data;
        setTickets(prev => prev.map(ticket => {
          if (ticket.ticketNumber === chatId) {
            return {
              ...ticket,
              issue: chat.reason,
              customerMessages: chat.messages.map((m: any) => ({
                id: m.id,
                text: m.text,
                sender: m.sender === 'customer' ? 'customer' : 'agent',
                timestamp: new Date(m.timestamp),
                status: m.sender === 'admin' ? 'sent' : undefined
              }))
            };
          }
          return ticket;
        }));
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const versions = [
    'CE Autonomous Agent',
    'Production Autonomous Agent',
    'Risk Team Autonomous Agent',
    'Support Team Autonomous Agent',
  ];

  // Populate input field from navigation state (from Recent Tickets)
  useEffect(() => {
    const state = location.state as { ticketId?: string };
    if (state?.ticketId) {
      setTicketInput(state.ticketId);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Listen for append ticket events
  useEffect(() => {
    const handleAppendTicket = (event: CustomEvent<{ ticketId: string }>) => {
      const newTicketId = event.detail.ticketId;
      setTicketInput(prev => {
        // Check if ticket already exists in input
        const existingIds = prev.split(',').map(id => id.trim()).filter(id => id.length > 0);
        if (existingIds.includes(newTicketId)) {
          return prev; // Don't add duplicates
        }
        // Append with comma
        return prev.trim() ? `${prev.trim()}, ${newTicketId}` : newTicketId;
      });
    };

    window.addEventListener('appendTicket', handleAppendTicket as EventListener);
    return () => window.removeEventListener('appendTicket', handleAppendTicket as EventListener);
  }, []);

  const loadTicket = () => {
    if (!ticketInput.trim()) return;

    // Split by comma to support multiple ticket IDs
    const ticketIds = ticketInput
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    const newTickets: TicketData[] = ticketIds.map(ticketId => {
      const hash = ticketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const issue = mockIssues[hash % mockIssues.length];

      return {
        ticketNumber: ticketId,
        issue,
        customerMessages: [], // Start empty, will be populated by history request
        conversationInput: '',
        aiSuggestion: '',
        isAiThinking: false,
        suggestionIndex: 0,
        isActive: true,
      };
    });

    // Request history for each new ticket
    if (ws) {
      ticketIds.forEach(id => {
        ws.send(JSON.stringify({
          action: 'get_history',
          chatId: id
        }));
      });
    }

    setTickets([...tickets, ...newTickets]);
    setTicketInput('');
  };

  const updateTicket = (index: number, updates: Partial<TicketData>) => {
    setTickets(prev => prev.map((ticket, i) => 
      i === index ? { ...ticket, ...updates } : ticket
    ));
  };

  const removeTicket = (index: number) => {
    setTickets(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Zap className="text-yellow-500" size={32} />
              AI Agent
            </h1>
            <p className="text-slate-600 mt-2">Fully autonomous AI agent - handles tickets automatically</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Version:</label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {versions.map((version) => (
                <option key={version} value={version}>{version}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadTicket()}
              placeholder="e.g., TICKET-12345 or TICKET-001, TICKET-002, TICKET-003"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={loadTicket}
              disabled={!ticketInput.trim()}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              Start Agent
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Separate multiple ticket IDs with commas to start agents for all at once
          </p>
        </div>
      </div>

      {tickets.length > 0 ? (
        <div className="space-y-6">
          {tickets.map((ticket, index) => (
            <div key={ticket.ticketNumber} className="h-[600px]">
              <TicketCard
                ticket={ticket}
                onUpdate={(updates) => updateTicket(index, updates)}
                onRemove={() => removeTicket(index)}
                ws={ws}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <Zap size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Agents</h3>
          <p className="text-slate-600">Enter a ticket number above to start an autonomous AI agent</p>
        </div>
      )}
    </div>
  );
}