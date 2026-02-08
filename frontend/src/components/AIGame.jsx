import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const THINK_SOUND = 'https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3';

const KEYWORDS = {
  nature: 12,
  plant: 14,
  alive: 10,
  living: 10,
  grow: 10,
  flower: 22,
  flowers: 22,
  floral: 18,
  petal: 18,
  petals: 18,
  bloom: 20,
  blossom: 18,
  bouquet: 22,
  yellow: 20,
  golden: 16,
  gold: 14,
  bright: 12,
  sunny: 14,
  sunshine: 14,
  sundrop: 25,
  sun: 10,
  gift: 10,
  present: 10,
  surprise: 8,
  happy: 10,
  smile: 10,
  joy: 10,
  beautiful: 8,
  pretty: 8,
  lovely: 8,
  rose: 16,
  garden: 12,
  color: 8,
  colorful: 10,
  fragrant: 14,
  smell: 12,
  scent: 14,
  vase: 14,
  stem: 12,
  leaf: 10,
  leaves: 10,
  green: 8,
  warm: 8,
  day: 6,
};

const LOW_RESPONSES = [
  "Hmm, interesting question! Let me think about that...",
  "That's a curious one! I'm processing...",
  "Good question! I'm picking up some vibes...",
  "Let me ponder that for a moment...",
  "Ooh, that gives me something to work with!",
  "I'm analyzing patterns... give me another clue!",
];

const MID_RESPONSES = [
  "Now we're getting somewhere! I'm starting to see a picture...",
  "That gives me a solid clue! I think I'm onto something...",
  "Interesting! My circuits are buzzing with ideas now...",
  "I'm connecting the dots... this is getting exciting!",
  "Oh! Things are becoming clearer now...",
  "My confidence is growing! A few more questions and I'll know...",
];

const HIGH_RESPONSES = [
  "I'm very close now! I can almost see it...",
  "Just a tiny bit more... I think I know what this is!",
  "My sensors are tingling! I'm nearly there...",
  "The answer is forming in my mind... so close!",
];

const FINAL_RESPONSE = "Wait... I think I know what this is...";

const getResponseForConfidence = (confidence, matchedAny) => {
  if (!matchedAny) {
    const generic = [
      "Hmm, that doesn't quite ring a bell yet. Try asking about its properties!",
      "I need a different angle. What does it look like? How does it feel?",
      "Interesting, but I need more clues. Think about colors, textures, nature...",
      "Let me file that away. Ask me something about what it might be made of!",
    ];
    return generic[Math.floor(Math.random() * generic.length)];
  }

  if (confidence < 35) {
    return LOW_RESPONSES[Math.floor(Math.random() * LOW_RESPONSES.length)];
  } else if (confidence < 65) {
    return MID_RESPONSES[Math.floor(Math.random() * MID_RESPONSES.length)];
  } else if (confidence < 85) {
    return HIGH_RESPONSES[Math.floor(Math.random() * HIGH_RESPONSES.length)];
  }
  return FINAL_RESPONSE;
};

export const AIGame = ({ onReveal }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input on mount after a short delay
    const timer = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  const analyzeInput = useCallback((text) => {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    let totalScore = 0;
    let matched = false;

    words.forEach((word) => {
      if (KEYWORDS[word]) {
        totalScore += KEYWORDS[word];
        matched = true;
      }
    });

    // Bonus for longer, more descriptive questions
    if (words.length > 5) totalScore += 3;
    if (text.includes('?')) totalScore += 2;

    return { totalScore, matched };
  }, []);

  const handleAsk = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isThinking || isRevealing) return;

    const newQuestion = { type: 'user', text: trimmed };
    setMessages((prev) => [...prev, newQuestion]);
    setInput('');
    setIsThinking(true);
    setQuestionCount((prev) => prev + 1);

    // Play subtle click
    try {
      const audio = new Audio(THINK_SOUND);
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) { /* silent */ }

    const { totalScore, matched } = analyzeInput(trimmed);

    // Simulate thinking delay
    const thinkTime = 1200 + Math.random() * 1500;

    setTimeout(() => {
      const newConfidence = Math.min(100, confidence + totalScore);
      setConfidence(newConfidence);

      const responseText = getResponseForConfidence(newConfidence, matched);
      setMessages((prev) => [...prev, { type: 'ai', text: responseText }]);
      setIsThinking(false);

      // Check if we should reveal
      // Require at least 2 questions AND confidence > 85
      if (newConfidence >= 85 && questionCount >= 1) {
        setIsRevealing(true);
        setTimeout(() => {
          onReveal();
        }, 2500);
      }
    }, thinkTime);
  }, [input, isThinking, isRevealing, confidence, questionCount, analyzeInput, onReveal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div
      className="stage-enter w-full max-w-md mx-auto px-4"
      data-testid="stage-2-ai-game"
    >
      <div className="glass-card p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4" data-testid="ai-header">
          <div className={`ai-orb ${isThinking ? 'thinking' : ''}`} data-testid="ai-orb" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100 tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Mystery Oracle
            </h2>
            <p className="text-xs text-slate-400">
              {isThinking ? 'thinking...' : 'online'}
            </p>
          </div>
        </div>

        {/* Prompt */}
        <p className="text-sm text-slate-300 leading-relaxed" data-testid="ai-prompt">
          Ask me any question. I'll try to guess what's inside the box.
        </p>

        {/* Confidence Bar */}
        <div className="space-y-2" data-testid="confidence-section">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 tracking-wider uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Confidence
            </span>
            <span className="text-xs text-blue-400 font-semibold">
              {Math.round(confidence)}%
            </span>
          </div>
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{ width: `${confidence}%` }}
              data-testid="confidence-bar"
            />
          </div>
        </div>

        {/* Chat Area */}
        <div
          className="space-y-3 max-h-52 overflow-y-auto pr-1 scrollbar-thin"
          data-testid="chat-area"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.3) transparent' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-blue-500/20 text-blue-100 rounded-br-md border border-blue-500/20'
                    : 'bg-white/5 text-slate-300 rounded-bl-md border border-white/5'
                }`}
                data-testid={`chat-message-${msg.type}-${idx}`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="chat-bubble flex justify-start">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-md border border-white/5">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Revealing Message */}
        {isRevealing && (
          <div className="text-center py-3" data-testid="revealing-message">
            <p className="text-amber-400 font-semibold animate-pulse text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              I think I know what this is...
            </p>
          </div>
        )}

        {/* Input Area */}
        {!isRevealing && (
          <div className="flex gap-3 items-end" data-testid="input-area">
            <input
              ref={inputRef}
              className="game-input flex-1"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              data-testid="question-input"
              autoComplete="off"
            />
            <button
              className="ask-button flex items-center gap-2"
              onClick={handleAsk}
              disabled={!input.trim() || isThinking}
              data-testid="ask-button"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>
        )}

        {/* Question Counter */}
        <p className="text-xs text-slate-600 text-center" data-testid="question-count">
          {questionCount === 0
            ? 'Ask anything to start guessing!'
            : `${questionCount} question${questionCount > 1 ? 's' : ''} asked`}
        </p>
      </div>
    </div>
  );
};
