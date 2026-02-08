import React, { useMemo } from 'react';

export const Stars = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 0.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="stars-container" data-testid="stars-background">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            width: `${s.size}px`,
            height: `${s.size}px`,
            left: `${s.left}%`,
            top: `${s.top}%`,
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
