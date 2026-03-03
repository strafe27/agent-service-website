import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ArrowRight, CheckCircle, LayoutGrid, X, Plus } from 'lucide-react';
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

function TicketCard({ 
  ticket, 
  onUpdate, 
  onRemove,
  ws,
  compact = false 
}: { 
  ticket: TicketData; 
  onUpdate: (updates: Partial<TicketData>) => void;
  onRemove: () => void;
  ws: WebSocket | null;
  compact?: boolean;
}) {
  const customerMessagesEndRef = useRef<HTMLDivElement>(null);
  const conversationInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    customerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.customerMessages]);

  const generateAiSuggestion = () => {
    if (!ws) return;
    onUpdate({ isAiThinking: true, aiSuggestion: '' });
    
    ws.send(JSON.stringify({
      action: 'request_ai_suggestion',
      chatId: ticket.ticketNumber
    }));
  };

  const handleCompose = () => {
    if (!ticket.aiSuggestion) return;
    onUpdate({ conversationInput: ticket.aiSuggestion });
    conversationInputRef.current?.focus();
  };

  const handleSendToCustomer = () => {
    if (!ticket.conversationInput.trim() || !ws) return;

    const text = ticket.conversationInput.trim();

    ws.send(JSON.stringify({
      action: 'send_message',
      chatId: ticket.ticketNumber,
      text: text
    }));

    const newMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'agent',
      timestamp: new Date(),
      status: 'sent',
    };

    onUpdate({
      customerMessages: [...ticket.customerMessages, newMessage],
      conversationInput: '',
      aiSuggestion: '',
    });
    
    setTimeout(() => {
      generateAiSuggestion();
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendToCustomer();
    }
  };

  const messageSize = compact ? 'text-xs' : 'text-sm';
  const iconSize = compact ? 16 : 20;
  const avatarSize = compact ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200 mb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{ticket.ticketNumber}</span>
          <span className="text-xs text-slate-600">{ticket.issue}</span>
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
            <h3 className={`font-bold ${compact ? 'text-sm' : 'text-base'} text-slate-900`}>Conversation</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
            {ticket.customerMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.sender === 'agent' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 ${avatarSize} rounded-full flex items-center justify-center ${
                  message.sender === 'customer' ? 'bg-slate-600' : 'bg-green-500'
                }`}>
                  {message.sender === 'customer' ? (
                    <User size={iconSize} className="text-white" />
                  ) : (
                    <Bot size={iconSize} className="text-white" />
                  )}
                </div>
                <div className={`flex flex-col max-w-[70%] ${message.sender === 'agent' ? 'items-end' : ''}`}>
                  <div className={`rounded-xl px-3 py-2 ${
                    message.sender === 'customer'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-green-500 text-white'
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
              ref={conversationInputRef}
              value={ticket.conversationInput}
              onChange={(e) => onUpdate({ conversationInput: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Type message..."
              rows={compact ? 2 : 3}
              className={`w-full px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${messageSize}`}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500">Press Enter</span>
              <button
                onClick={handleSendToCustomer}
                disabled={!ticket.conversationInput.trim()}
                className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1`}
              >
                <Send size={compact ? 12 : 14} />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="border-b border-slate-200 p-2 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className={`font-bold ${compact ? 'text-sm' : 'text-base'} text-slate-900`}>AI Assistant</h3>
              <Sparkles size={iconSize} className="text-blue-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {ticket.isAiThinking ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 size={compact ? 32 : 40} className="text-blue-500 animate-spin mb-2" />
                <p className={`${messageSize} text-slate-600`}>AI is thinking...</p>
              </div>
            ) : ticket.aiSuggestion ? (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-2">
                    <Bot size={iconSize} className="text-blue-600" />
                    <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-blue-900`}>Suggestion</span>
                  </div>
                  <p className={`text-slate-700 whitespace-pre-wrap leading-relaxed ${messageSize}`}>{ticket.aiSuggestion}</p>
                </div>

                <button
                  onClick={handleCompose}
                  className={`w-full ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-1`}
                >
                  <ArrowRight size={iconSize} />
                  Compose
                </button>

                <button
                  onClick={generateAiSuggestion}
                  disabled={ticket.isAiThinking}
                  className={`w-full ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium`}
                >
                  New Suggestion
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Bot size={compact ? 32 : 40} className="mb-2 opacity-50" />
                <p className={messageSize}>No suggestions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIAssistant() {
  const location = useLocation();
  const [selectedVersion, setSelectedVersion] = useState('CE Test AI Assistant');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketInput, setTicketInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8081/ws?role=admin`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        // Sync existing tickets with loaded ones
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
            // Avoid duplicates if we just sent it
            if (ticket.customerMessages.some(m => m.id === newMsg.id)) return ticket;
            
            const mappedMsg: Message = {
              id: newMsg.id,
              text: newMsg.text,
              sender: newMsg.sender === 'customer' ? 'customer' : 'agent',
              timestamp: new Date(newMsg.timestamp),
              status: newMsg.sender === 'admin' ? 'sent' : undefined
            };

            const isNewCustomerMessage = mappedMsg.sender === 'customer';

            return {
              ...ticket,
              customerMessages: [...ticket.customerMessages, mappedMsg],
              isAiThinking: isNewCustomerMessage ? true : ticket.isAiThinking,
              aiSuggestion: isNewCustomerMessage ? '' : ticket.aiSuggestion
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
      } else if (data.type === 'ai_suggestion') {
        const { chatId, suggestion } = data;
        setTickets(prev => prev.map(ticket => {
          if (ticket.ticketNumber === chatId) {
            return {
              ...ticket,
              aiSuggestion: suggestion,
              isAiThinking: false
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
    'CE Test AI Assistant',
    'CE Production AI Assistant',
    'Risk Team AI Assistant',
    'Support Team AI Assistant',
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
        isAiThinking: true,
        suggestionIndex: 0,
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
            <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
            <p className="text-slate-600 mt-2">AI-assisted customer support with human review</p>
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

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadTicket()}
              placeholder="e.g., TICKET-12345 or TICKET-001, TICKET-002, TICKET-003"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadTicket}
              disabled={!ticketInput.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              Load Ticket
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Separate multiple ticket IDs with commas to load them all at once
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
          <Bot size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Tickets Loaded</h3>
          <p className="text-slate-600">Enter a ticket number above to start AI-assisted support</p>
        </div>
      )}
    </div>
  );
}