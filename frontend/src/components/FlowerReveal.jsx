import React, { useEffect, useRef } from 'react';
import { Fireflies } from './Fireflies';

const REVEAL_SOUND = 'https://assets.mixkit.co/sfx/preview/mixkit-ethereal-fairy-win-sound-2019.mp3';
const FLOWER_IMAGE = 'https://images.unsplash.com/photo-1675735721863-1bea5c75720f?auto=format&fit=crop&q=80&w=800';

const TAG_TEXT = `A small sundrop bouquet
just to add a little brightness to your day.
Happy Rose Day!`;

export const FlowerReveal = () => {
  const audioPlayed = useRef(false);

  useEffect(() => {
    if (!audioPlayed.current) {
      audioPlayed.current = true;
      try {
        const audio = new Audio(REVEAL_SOUND);
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch (e) { /* silent */ }
    }
  }, []);

  return (
    <div
      className="flower-reveal-container flex flex-col items-center justify-center gap-8 px-4 relative"
      data-testid="stage-3-reveal"
    >
      {/* Fireflies */}
      <Fireflies count={20} />

      {/* Flower Image */}
      <div className="flower-image-wrapper" data-testid="flower-image-wrapper">
        {/* Glow Behind */}
        <div className="flower-glow" />

        <img
          src={FLOWER_IMAGE}
          alt="Yellow sundrop flower bouquet"
          className="flower-image relative z-10"
          data-testid="flower-image"
          loading="eager"
        />
      </div>

      {/* Hanging Tag */}
      <div className="hanging-tag w-full max-w-xs" data-testid="hanging-tag">
        <div className="tag-card text-center">
          <p
            className="text-amber-300/90 text-sm md:text-base leading-relaxed whitespace-pre-line"
            style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
            data-testid="tag-text"
          >
            {TAG_TEXT}
          </p>
          <div className="mt-3 flex justify-center">
            <span className="text-2xl" role="img" aria-label="sunflower">
              🌼
            </span>
          </div>
        </div>
      </div>

      {/* Subtle footer text */}
      <p
        className="text-xs text-slate-600 mt-4 tracking-wider animate-pulse"
        style={{ animationDelay: '4s' }}
        data-testid="footer-text"
      >
        made with care
      </p>
    </div>
  );
};
