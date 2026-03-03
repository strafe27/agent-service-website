import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Sidebar } from './components/sidebar';
import { Chatbot } from './components/chatbot';
import { Workflows } from './components/workflows';
import { AIAssistant } from './components/ai-assistant';
import { AIAgent } from './components/ai-agent';
import { Settings } from './components/settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/chatbot" replace />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/ai-agent" element={<AIAgent />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}