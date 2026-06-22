import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Key, AlertCircle, X, Copy, CheckCheck } from 'lucide-react';

// Plant context for the AI
const PLANT_CONTEXT = `
You are ISPAT AI Assistant, an expert AI for Ispat Steel Plant's operational intelligence platform.

Current Plant Status (June 18, 2026):
- Today's Production: 850 Tons (Target: 1000 Tons, Loss: 150 Tons)
- Plant Efficiency: 85% (Target: 92%)
- Total Downtime: 4.2 Hours

CRITICAL MACHINES:
1. Conveyor M12 (Rolling Mill) - Failure Risk: 87%, RUL: 7 days, Issue: Bearing wear, vibration 8.4mm/s
2. Coke Oven COM-1 (Blast Furnace) - Failure Risk: 73%, RUL: 12 days, Temperature 88°C

PRODUCTION LOSSES TODAY:
- Conveyor Failure: 60 Tons
- Shift Delay: 40 Tons  
- Material Delay: 30 Tons
- Energy Loss: 12 Tons
- Maintenance Stop: 8 Tons

SHIFT PERFORMANCE:
- Morning Shift: 92% efficiency (Supervisor: Rajesh Kumar)
- Evening Shift: 83% efficiency (Supervisor: Amit Sharma)
- Night Shift: 74% efficiency (Supervisor: Suresh Patil) - POOR performance due to 4.2h downtime

DEPARTMENT EFFICIENCY:
1. Power Plant: 91% (Best)
2. Steel Melt Shop: 86%
3. Blast Furnace: 82%
4. Rolling Mill: 78%
5. Maintenance: 71% (Needs urgent improvement)

ENERGY WASTE: 12.3% wasted (₹1,99,200/day). Top cause: Idle Conveyor Operations (18.5 MWh)

AI PREDICTIONS:
- Tomorrow's forecast: 985 Tons (using Prophet + LSTM)
- Expected downtime tomorrow: 3.8 hours
- Conveyor M12 will likely fail within 7 days (87% confidence)
- Potential energy savings: ₹1.99 Lakhs/day

Answer questions concisely and professionally. Use data from above. Give actionable recommendations. Format responses clearly with bullet points when listing items. Use emojis sparingly but effectively.`;

const SUGGESTED_QUESTIONS = [
  "Why is production decreasing today?",
  "Which machine needs urgent maintenance?",
  "Which shift performed the worst?",
  "How can we reduce energy waste?",
  "What is the root cause of today's 150T loss?",
  "Predict tomorrow's production",
  "Which department causes maximum losses?",
  "What should maintenance team do right now?",
];

// Simple markdown-lite renderer for AI responses
function renderContent(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={i} className="flex items-start gap-2 mt-1">
          <span className="text-sky-400 mt-0.5 flex-shrink-0">•</span>
          <span>{parts}</span>
        </div>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <div key={i} className="mt-0.5">{parts}</div>;
  });
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 message-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={15} className="text-white" />
        </div>
      )}
      <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-primary-500 text-white rounded-tr-sm ml-10'
          : 'bg-surface-800 border border-gray-800 text-gray-200 rounded-tl-sm'
      }`}>
        {isUser ? msg.content : renderContent(msg.content)}
        <div className={`text-xs mt-2 ${isUser ? 'text-primary-200' : 'text-gray-600'}`}>{msg.time}</div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={15} className="text-white" />
        </div>
      )}
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm ISPAT AI, your plant intelligence assistant. I have full access to today's production data, machine health, shift performance, and energy analytics.\n\n⚡ ALERT: Conveyor M12 shows 87% failure risk — action required within 7 days.\n\nHow can I help you today?",
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('ispat_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('ispat_gemini_key'));
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveKey = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem('ispat_gemini_key', keyInput.trim());
    setApiKey(keyInput.trim());
    setShowKeyInput(false);
    setError('');
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userMsg = {
      role: 'user',
      content: text.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          api_key: apiKey
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to chat with AI Assistant.');
      }

      const responseText = data.content;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      // Show the actual error so user knows what went wrong
      setError(err.message || 'Unknown error. Check console for details.');
      console.error('Assistant API Error:', err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">
      {/* API Key Banner */}
      {showKeyInput && (
        <div className="flex-shrink-0 mx-6 mt-6 mb-0">
          <div className="card border border-primary-500/30 bg-primary-500/5 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-primary-400" />
                <span className="text-sm font-semibold text-white">Enter Gemini API Key</span>
              </div>
              {apiKey && (
                <button onClick={() => setShowKeyInput(false)} className="text-gray-500 hover:text-gray-300">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Get your free key from <span className="text-primary-400">aistudio.google.com</span> → Create API Key
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
                placeholder="AIza..."
                className="input-dark flex-1"
              />
              <button onClick={saveKey} className="btn-primary">
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3 justify-start message-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-800 border border-gray-800">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
                <span className="text-xs text-gray-500 ml-1">Analyzing plant data...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`p-4 rounded-xl border text-sm ${
            error.toLowerCase().includes('quota') || error.toLowerCase().includes('exceeded')
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className={`flex-shrink-0 mt-0.5 ${
                error.toLowerCase().includes('quota') ? 'text-amber-400' : 'text-red-400'
              }`} />
              <div className="flex-1">
                {error.toLowerCase().includes('quota') || error.toLowerCase().includes('exceeded') ? (
                  <div>
                    <p className="text-amber-400 font-semibold mb-1">⚡ API Quota Exceeded</p>
                    <p className="text-gray-400 text-xs mb-2">
                      Your Gemini API key has exhausted its free tier limit for today. This resets daily.
                    </p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>✓ <strong className="text-white">Option 1:</strong> Wait a few minutes, then try again</p>
                      <p>✓ <strong className="text-white">Option 2:</strong> Go to <span className="text-sky-400">aistudio.google.com</span> → Create a new API key</p>
                      <p>✓ <strong className="text-white">Option 3:</strong> Enable billing on Google Cloud to unlock higher limits</p>
                    </div>
                    <button onClick={() => { setShowKeyInput(true); setKeyInput(''); setError(''); }}
                      className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all">
                      Enter a different API key →
                    </button>
                  </div>
                ) : (
                  <p className="text-red-400">{error}</p>
                )}
              </div>
            </div>
          </div>
        )}


        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600 mb-2">Suggested questions:</p>
        <div className="flex gap-2 flex-wrap">
          {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
            <button key={i} onClick={() => {
              if (!apiKey) {
                setInput(q);
                setShowKeyInput(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              } else {
                sendMessage(q);
              }
            }}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-800">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about plant operations, machines, shifts..."
              rows={1}
              className="input-dark w-full resize-none pr-12"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #0ea5e9, #818cf8)' : '#1f2937' }}>
            <Send size={16} className="text-white" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-600">Powered by Gemini 2.0 Flash • Enter to send, Shift+Enter for new line</p>
          {apiKey && (
            <button onClick={() => { setShowKeyInput(true); setKeyInput(''); }}
              className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1">
              <Key size={10} /> Change key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
