import React, { useMemo } from 'react';

export const Fireflies = ({ count = 15 }) => {
  const fireflies = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 6 + 6;
      const delay = Math.random() * 4;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const x1 = (Math.random() - 0.5) * 80;
      const y1 = (Math.random() - 0.5) * 80;
      const x2 = (Math.random() - 0.5) * 100;
      const y2 = (Math.random() - 0.5) * 100;
      const x3 = (Math.random() - 0.5) * 60;
      const y3 = (Math.random() - 0.5) * 60;

      return (
        <div
          key={i}
          className="firefly"
          style={{
            '--size': `${size}px`,
            '--duration': `${duration}s`,
            '--delay': `${delay}s`,
            '--x1': `${x1}px`,
            '--y1': `${y1}px`,
            '--x2': `${x2}px`,
            '--y2': `${y2}px`,
            '--x3': `${x3}px`,
            '--y3': `${y3}px`,
            left: `${left}%`,
            top: `${top}%`,
          }}
        />
      );
    });
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" data-testid="fireflies">
      {fireflies}
    </div>
  );
};
