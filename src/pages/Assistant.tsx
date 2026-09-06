import { useState, useRef, useEffect } from 'react';
import { SCHEMES, USER_PROFILE, checkEligibility } from '../data/schemes';

interface Props {
  onNavigate: (page: string, id?: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Which scheme is best for me?',
  'Why am I not eligible for some schemes?',
  'What document am I missing?',
  'What should I do first?',
  'Which scheme gives equipment support?',
  'How do I get a loan for my business?',
];

function generateResponse(question: string): string {
  const q = question.toLowerCase();
  const results = SCHEMES.map(s => ({ scheme: s, eligibility: checkEligibility(s, USER_PROFILE) }));
  const eligible = results.filter(r => r.eligibility.status === 'ELIGIBLE');
  const nearMiss = results.filter(r => r.eligibility.status === 'NEAR_MISS');
  const missingDocuments = [...new Set(nearMiss.flatMap(result => result.scheme.documents.filter(document => document.required && !(USER_PROFILE.documents || []).includes(document.name)).map(document => document.name)))];

  if (q.includes('best') || q.includes('top') || q.includes('which scheme')) {
    const top = eligible[0];
    if (top) return `Based on your saved profile as a ${USER_PROFILE.gender || 'entrepreneur'} in ${USER_PROFILE.state || 'your state'} with a ${USER_PROFILE.businessType || 'business'} business, your best current match is:\n\n**${top.scheme.name}**\n\n${top.scheme.benefits}\n\nYour match score is ${top.eligibility.matchScore}%.`;
    return `I checked ${results.length} schemes against your saved profile and found no fully eligible result yet. Complete your profile or review the almost-eligible section to see what can be improved.`;
  }

  if (q.includes('not eligible') || q.includes('why')) {
    const gaps = [...new Set(nearMiss.flatMap(result => [...result.eligibility.missing, ...result.eligibility.failed]))];
    return `Your closest matches currently have these gaps:\n\n${gaps.slice(0, 4).map(gap => `• ${gap}`).join('\n') || 'No specific gap was detected.'}\n\nUpdate your profile after resolving a gap and the match scores will recalculate.`;
  }

  if (q.includes('document') || q.includes('missing')) {
    return `Based on the documents saved in your profile:\n\n✓ You have: ${(USER_PROFILE.documents || []).join(', ') || 'No documents marked yet'}\n○ Missing across your closest matches: ${missingDocuments.join(', ') || 'No required documents identified'}\n\nUpdate your profile to change what you have, then open a scheme to see its exact checklist.`;
  }

  if (q.includes('first') || q.includes('next') || q.includes('start')) {
    const nextGap = nearMiss.flatMap(result => result.eligibility.missing)[0] || missingDocuments[0] || 'Complete your profile';
    return `Your recommended first action is:\n\n**${nextGap}**\n\nThis is the highest-priority gap in your current matches. Update your profile after completing it so recommendations recalculate.`;
  }

  if (q.includes('equipment') || q.includes('machinery') || q.includes('tool')) {
    const equipmentSchemes = results.filter(r =>
      r.scheme.category === 'equipment' ||
      r.scheme.tags.includes('technology') ||
      r.scheme.name.toLowerCase().includes('equipment')
    );
    return `For equipment support, I found ${equipmentSchemes.length} catalog options:\n\n${equipmentSchemes.slice(0, 3).map(result => `**${result.scheme.name}** — ${result.scheme.benefits}`).join('\n\n') || 'No equipment schemes are currently published.'}`;
  }

  if (q.includes('loan') || q.includes('funding') || q.includes('money') || q.includes('credit')) {
    const funding = results.filter(result => ['funding', 'loan', 'subsidy'].includes(result.scheme.category));
    return `Based on your ${USER_PROFILE.businessInvestment ? `₹${USER_PROFILE.businessInvestment.toLocaleString('en-IN')} investment need` : 'saved profile'}, these funding options are in the catalog:\n\n${funding.slice(0, 3).map((result, index) => `**${index + 1}. ${result.scheme.name}** — ${result.scheme.benefits}`).join('\n\n') || 'No funding options are currently available.'}`;
  }

  return `Based on your saved profile, you currently match ${eligible.length} schemes and are almost eligible for ${nearMiss.length} more. Ask about a specific scheme, document, funding option, or next step.`;
}

export default function Assistant({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I'm SchemeX Assistant. I'm here to help you understand government schemes, your eligibility, and what to do next.\n\nI work with your actual profile data — I won't invent schemes or make up eligibility rules. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(text);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: response, timestamp: new Date() }]);
    }, 1200);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const speakMessage = (text: string) => {
    const clean = text.replace(/\*\*/g, '').replace(/\n/g, ' ');
    const utt = new SpeechSynthesisUtterance(clean);
    window.speechSynthesis?.speak(utt);
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold" style={{ color: '#1E3A5F' }}>{line.slice(2, -2)}</p>;
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="leading-relaxed">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }} className="sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={() => onNavigate('landing')} style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.1rem', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </button>
          <span style={{ color: '#E5E0D8' }}>›</span>
          <span className="text-sm" style={{ color: '#7A8B99' }}>AI Assistant</span>
          <div className="ml-auto flex gap-3">
            <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium" style={{ color: '#7A8B99' }}>
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Context bar */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-4">
        <div className="px-4 py-3 rounded-xl text-xs flex items-center gap-3"
          style={{ backgroundColor: '#1E3A5F0A', border: '1px solid #1E3A5F22' }}>
          <span style={{ color: '#1E3A5F' }}>🧭</span>
          <span style={{ color: '#7A8B99' }}>
            Using your profile: <strong style={{ color: '#2D2A26' }}>{USER_PROFILE.name || 'Profile in progress'}</strong> ·
            {USER_PROFILE.gender || 'Gender not set'} · {USER_PROFILE.state || 'State not set'} · {USER_PROFILE.businessType || 'Business type not set'}
          </span>
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#1E6B3C22', color: '#1E6B3C' }}>
            Live data
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 space-y-5 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>S</div>
                  <span className="text-xs font-semibold" style={{ color: '#1E3A5F' }}>SchemeX</span>
                  <span className="text-xs" style={{ color: '#7A8B99' }}>
                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div
                className="px-4 py-3 rounded-2xl text-sm space-y-1.5"
                style={{
                  backgroundColor: msg.role === 'user' ? '#1E3A5F' : '#fff',
                  color: msg.role === 'user' ? '#FAF7F0' : '#2D2A26',
                  border: msg.role === 'assistant' ? '1px solid #E5E0D8' : 'none',
                  borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '0.25rem 1rem 1rem 1rem',
                }}
              >
                {msg.role === 'assistant' ? formatText(msg.text) : <p>{msg.text}</p>}
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speakMessage(msg.text)}
                  className="mt-1 text-xs flex items-center gap-1 transition-colors"
                  style={{ color: '#7A8B99' }}
                  aria-label="Listen to this message"
                >
                  🔊 Listen
                </button>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8', borderRadius: '0.25rem 1rem 1rem 1rem' }}>
              <div className="flex gap-1" aria-label="SchemeX is typing">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E8A33D', animation: `bounce 1s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 2 && (
        <div className="max-w-3xl mx-auto w-full px-6 pb-3">
          <div className="text-xs font-semibold mb-2" style={{ color: '#7A8B99' }}>Suggested questions</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: '#fff', color: '#1E3A5F', border: '1px solid #E5E0D8' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#1E3A5F')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E0D8')}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: '1px solid #E5E0D8', backgroundColor: '#fff' }} className="sticky bottom-0">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about schemes, eligibility, documents, or next steps…"
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl text-sm resize-none"
              style={{ border: '1.5px solid #E5E0D8', color: '#2D2A26', outline: 'none', maxHeight: '120px', lineHeight: 1.5 }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1E3A5F')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E0D8')}
              aria-label="Type your question"
            />
            <button
              onClick={handleVoice}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-colors shrink-0"
              style={{ backgroundColor: isListening ? '#C7511F' : '#FAF7F0', border: '1.5px solid #E5E0D8' }}
              aria-label={isListening ? 'Listening…' : 'Voice input'}
              title="Voice input"
            >
              🎤
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all shrink-0"
              style={{
                backgroundColor: input.trim() && !isTyping ? '#1E3A5F' : '#E5E0D8',
                color: '#FAF7F0',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              }}
              aria-label="Send message"
            >
              →
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: '#7A8B99' }}>
            SchemeX uses only your actual profile data. It never invents schemes or eligibility rules.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </div>
  );
}
