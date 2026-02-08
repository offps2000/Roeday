import React, { useState, useCallback } from 'react';
import '@/App.css';
import { Stars } from '@/components/Stars';
import { GiftBox } from '@/components/GiftBox';
import { AIGame } from '@/components/AIGame';
import { FlowerReveal } from '@/components/FlowerReveal';

function App() {
  const [stage, setStage] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  const goToStage = useCallback((nextStage) => {
    setTransitioning(true);
    setTimeout(() => {
      setStage(nextStage);
      setTransitioning(false);
    }, 600);
  }, []);

  const handleBoxOpen = useCallback(() => {
    goToStage(2);
  }, [goToStage]);

  const handleReveal = useCallback(() => {
    goToStage(3);
  }, [goToStage]);

  return (
    <div className="app-background" data-testid="app-container">
      {/* Background Stars */}
      <Stars />

      {/* Main Content */}
      <main
        className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center py-12 px-4"
        data-testid="main-content"
      >
        <div
          className={`w-full max-w-lg transition-all duration-600 ${
            transitioning ? 'opacity-0 scale-95 translate-y-[-20px]' : 'opacity-100 scale-100 translate-y-0'
          }`}
          style={{ transition: 'opacity 0.6s ease, transform 0.6s ease' }}
        >
          {stage === 1 && <GiftBox onOpen={handleBoxOpen} />}
          {stage === 2 && <AIGame onReveal={handleReveal} />}
          {stage === 3 && <FlowerReveal />}
        </div>
      </main>
    </div>
  );
}

export default App;
