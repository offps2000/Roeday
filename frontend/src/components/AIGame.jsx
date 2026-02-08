import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HelpCircle, Sparkles, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const THINK_SOUND = 'https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3';

const LABEL_RESPONSES = {
  yes: [
    "Yes! You're on the right track!",
    "That's correct! Keep going!",
    "Absolutely! You're getting closer!",
    "Yes indeed! Smart question!",
    "Right on! You're narrowing it down!",
  ],
  no: [
    "Nope, that's not it!",
    "No, try a different direction!",
    "Not quite! Think again...",
    "No, but good question!",
    "That's a no! Keep guessing!",
  ],
  close: [
    "Getting warmer! You're so close!",
    "Almost! You're in the right neighborhood!",
    "Very close! Just a little more...",
    "Hot! You're nearly there!",
    "So close I can feel it!",
  ],
  "i don't know": [
    "Hmm, that's a tricky one...",
    "Not sure about that! Try something else.",
    "Hard to say... ask something different!",
    "That's debatable... keep exploring!",
    "I'm on the fence with that one!",
  ],
  "too far away": [
    "Way off! Think completely differently!",
    "Not even close! Change your approach!",
    "Miles away! Try another angle!",
    "Totally off track! Rethink this!",
    "Nope, you're in the wrong galaxy!",
  ],
};

const getRandomResponse = (label) => {
  const responses = LABEL_RESPONSES[label];
  if (!responses) return "Interesting...";
  return responses[Math.floor(Math.random() * responses.length)];
};

export const AIGame = ({ onReveal }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(20);
  const [isRevealing, setIsRevealing] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [checkingModel, setCheckingModel] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API}/game/status`);
        const data = await res.json();
        if (data.model_ready) {
          setModelReady(true);
          setCheckingModel(false);
          clearInterval(pollRef.current);
          await fetch(`${API}/game/reset`, { method: 'POST' });
          setTimeout(() => inputRef.current?.focus(), 300);
        }
      } catch (e) { /* not ready */ }
    };
    checkStatus();
    pollRef.current = setInterval(checkStatus, 2000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const triggerReveal = useCallback(() => {
    setIsRevealing(true);
    setTimeout(() => onReveal(), 2500);
  }, [onReveal]);

  const handleAsk = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking || isRevealing || !modelReady) return;

    setMessages((prev) => [...prev, { type: 'user', text: trimmed }]);
    setInput('');
    setIsThinking(true);

    try {
      const audio = new Audio(THINK_SOUND);
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) { /* silent */ }

    try {
      const res = await fetch(`${API}/game/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();

      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));

      setQuestionCount(data.question_count || 0);

      if (data.guessed_correctly) {
        setMessages((prev) => [
          ...prev,
          { type: 'ai', text: data.response || "YES! You guessed it! The answer is ROSE!", highlight: true },
        ]);
        setIsThinking(false);
        triggerReveal();
        return;
      }

      if (data.game_over) {
        setMessages((prev) => [
          ...prev,
          { type: 'ai', text: "Time's up! Let me show you what was inside...", highlight: true },
        ]);
        setIsThinking(false);
        triggerReveal();
        return;
      }

      const label = data.label;
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: getRandomResponse(label), label },
      ]);
      setIsThinking(false);
    } catch (e) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: "Hmm, I had a hiccup. Try again!" },
      ]);
    }
  }, [input, isThinking, isRevealing, modelReady, triggerReveal]);

  const handleGuess = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking || isRevealing || !modelReady) return;

    setMessages((prev) => [...prev, { type: 'user', text: `My guess: ${trimmed}` }]);
    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch(`${API}/game/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: trimmed }),
      });
      const data = await res.json();

      await new Promise((r) => setTimeout(r, 800));

      if (data.correct) {
        setMessages((prev) => [
          ...prev,
          { type: 'ai', text: "YES! You got it! The answer is ROSE!", highlight: true },
        ]);
        setIsThinking(false);
        triggerReveal();
      } else {
        setQuestionCount(data.question_count || questionCount);
        setMessages((prev) => [
          ...prev,
          { type: 'ai', text: data.message || "Nope, try again!" },
        ]);
        setIsThinking(false);

        if (data.game_over) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { type: 'ai', text: "Out of questions! Let me reveal what's inside...", highlight: true },
            ]);
            triggerReveal();
          }, 1000);
        }
      }
    } catch (e) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: "Something went wrong, try again!" },
      ]);
    }
  }, [input, isThinking, isRevealing, modelReady, questionCount, triggerReveal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (checkingModel || !modelReady) {
    return (
      <div className="stage-enter w-full max-w-md mx-auto px-4" data-testid="stage-2-loading">
        <div className="glass-card p-8 flex flex-col items-center gap-6">
          <div className="ai-orb thinking" />
          <div className="text-center space-y-3">
            <h2
              className="text-lg font-semibold text-slate-100 tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Waking up the Oracle...
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="animate-spin" size={16} />
              <span>Training neural pathways</span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              The AI is preparing itself. This takes about 30-60 seconds on first load.
            </p>
          </div>
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  const questionsLeft = maxQuestions - questionCount;

  return (
    <div
      className="stage-enter w-full max-w-md mx-auto px-4"
      data-testid="stage-2-ai-game"
    >
      <div className="glass-card p-6 md:p-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4" data-testid="ai-header">
          <div className={`ai-orb ${isThinking ? 'thinking' : ''}`} data-testid="ai-orb" />
          <div className="flex-1">
            <h2
              className="text-lg font-semibold text-slate-100 tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Mystery Oracle
            </h2>
            <p className="text-xs text-slate-400">
              {isThinking ? 'thinking...' : 'ML-powered'}
            </p>
          </div>
          {/* Question Counter Pill */}
          <div
            className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5"
            data-testid="question-counter"
          >
            <span className="text-xs text-slate-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Q</span>
            <span className={`text-sm font-bold ${questionsLeft <= 5 ? 'text-amber-400' : 'text-blue-400'}`}>
              {questionCount}
            </span>
            <span className="text-xs text-slate-500">/ {maxQuestions}</span>
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5" data-testid="game-rules">
          <p className="text-sm text-slate-300 leading-relaxed">
            I'm thinking of something. Ask me yes/no questions to figure it out!
            {questionsLeft <= 5 ? (
              <span className="text-amber-400 font-semibold"> Only {questionsLeft} questions left!</span>
            ) : (
              <span> You have <span className="text-blue-400 font-semibold">{questionsLeft}</span> questions left.</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            Think you know? Use the <Sparkles size={12} className="inline text-amber-400" /> Guess button
          </p>
        </div>

        {/* Chat Area */}
        <div
          className="space-y-3 max-h-56 overflow-y-auto pr-1"
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
                    : msg.highlight
                    ? 'bg-amber-500/20 text-amber-200 rounded-bl-md border border-amber-500/30'
                    : 'bg-white/5 text-slate-300 rounded-bl-md border border-white/5'
                }`}
                data-testid={`chat-message-${msg.type}-${idx}`}
              >
                {msg.text}
                {msg.label && (
                  <span className="block text-xs text-slate-500 mt-1 italic">
                    [{msg.label}]
                  </span>
                )}
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
            <p
              className="text-amber-400 font-semibold animate-pulse text-base"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Unveiling the mystery...
            </p>
          </div>
        )}

        {/* Input Area */}
        {!isRevealing && (
          <div className="flex gap-2 items-end" data-testid="input-area">
            <input
              ref={inputRef}
              className="game-input flex-1"
              placeholder="Ask a yes/no question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              data-testid="question-input"
              autoComplete="off"
            />
            <button
              className="ask-button flex items-center gap-1.5"
              onClick={handleAsk}
              disabled={!input.trim() || isThinking}
              data-testid="ask-button"
              title="Ask a question"
            >
              <HelpCircle size={15} />
              <span className="hidden sm:inline text-xs">Ask</span>
            </button>
            <button
              className="ask-button flex items-center gap-1.5"
              onClick={handleGuess}
              disabled={!input.trim() || isThinking}
              data-testid="guess-button"
              title="Submit your guess"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline text-xs">Guess</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
