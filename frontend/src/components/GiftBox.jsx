import React, { useState, useCallback } from 'react';

const CLICK_SOUND = 'https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3';

export const GiftBox = ({ onOpen }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (isOpening) return;
    setIsOpening(true);

    // Play click sound
    try {
      const audio = new Audio(CLICK_SOUND);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) { /* silent */ }

    setTimeout(() => {
      onOpen();
    }, 1200);
  }, [isOpening, onOpen]);

  return (
    <div
      className="stage-enter flex flex-col items-center justify-center gap-8 px-4"
      data-testid="stage-1-package"
    >
      {/* Gift Box */}
      <div
        className={`gift-box-wrapper relative ${isOpening ? 'gift-box-opening' : ''}`}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-testid="gift-box-clickable"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label="Click to open the gift"
      >
        {/* Glow Effect */}
        <div className="gift-box-glow" />

        {/* SVG Gift Box */}
        <svg
          className="gift-box-svg"
          width="180"
          height="200"
          viewBox="0 0 180 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: hovered && !isOpening ? 'scale(1.05)' : 'scale(1)' }}
        >
          {/* Box Body */}
          <rect
            x="15"
            y="90"
            width="150"
            height="100"
            rx="8"
            fill="url(#boxGradient)"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="1.5"
          />
          {/* Box Shine */}
          <rect
            x="15"
            y="90"
            width="150"
            height="100"
            rx="8"
            fill="url(#boxShine)"
            opacity="0.3"
          />
          {/* Vertical Ribbon */}
          <rect
            x="78"
            y="90"
            width="24"
            height="100"
            fill="url(#ribbonGradient)"
            opacity="0.7"
          />
          {/* Horizontal Ribbon */}
          <rect
            x="15"
            y="128"
            width="150"
            height="24"
            fill="url(#ribbonGradient)"
            opacity="0.7"
          />

          {/* Lid */}
          <g className="gift-lid">
            <rect
              x="5"
              y="70"
              width="170"
              height="30"
              rx="6"
              fill="url(#lidGradient)"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="1.5"
            />
            <rect
              x="5"
              y="70"
              width="170"
              height="30"
              rx="6"
              fill="url(#boxShine)"
              opacity="0.3"
            />
            {/* Lid Ribbon */}
            <rect
              x="78"
              y="70"
              width="24"
              height="30"
              fill="url(#ribbonGradient)"
              opacity="0.7"
            />
            {/* Bow */}
            <ellipse cx="90" cy="70" rx="22" ry="14" fill="url(#bowGradient)" opacity="0.9" />
            <ellipse cx="90" cy="70" rx="6" ry="8" fill="#fbbf24" opacity="0.6" />
            <path
              d="M68 70 C68 56, 90 52, 90 70 C90 52, 112 56, 112 70"
              stroke="#fbbf24"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="boxGradient" x1="15" y1="90" x2="165" y2="190">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="boxShine" x1="15" y1="90" x2="165" y2="90">
              <stop offset="0%" stopColor="white" stopOpacity="0.1" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="ribbonGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="lidGradient" x1="5" y1="70" x2="175" y2="100">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <radialGradient id="bowGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      <div className="text-center space-y-4" data-testid="stage-1-text">
        <p className="package-text text-base md:text-lg tracking-widest uppercase font-light">
          A small package for you
        </p>
        {!isOpening && (
          <p className="tap-hint text-xs text-slate-500 tracking-wider">
            tap to open
          </p>
        )}
        {isOpening && (
          <p className="text-xs text-blue-400/60 tracking-wider animate-pulse">
            opening...
          </p>
        )}
      </div>
    </div>
  );
};
