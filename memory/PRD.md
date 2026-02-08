# Rose Day Interactive Experience - PRD

## Original Problem Statement
Build a single-page interactive website for Rose Day, intended for a female friend (strictly non-romantic, friendly, warm). Three-stage experience: Gift Box → ML-powered 20-Questions AI Game → Yellow Sundrop Flower Reveal.

## Architecture
- **Frontend**: React with Tailwind CSS, glassmorphism design, CSS animations
- **Backend**: FastAPI with PyTorch + sentence-transformers (all-MiniLM-L6-v2)
- **ML Model**: RoseClassifier - 2-layer neural net trained on semantic knowledge base
- **No Database**: Game state is in-memory (single user experience)

## User Personas
- **Primary**: A female friend receiving a thoughtful, creative Rose Day gift experience
- **Tone**: Friendly, warm, playful, tech-savvy — strictly non-romantic

## Core Requirements (Static)
1. Single page, 3-stage interactive experience
2. Dark navy gradient background with glassmorphism
3. Stage 1: Animated gift box with floating/pulsing effects
4. Stage 2: ML-powered 20-questions game (sentence-transformers)
5. Stage 3: Yellow sundrop flower bouquet reveal with fireflies and hanging tag
6. Sound effects at key interactions
7. Mobile-first responsive design
8. Smooth CSS animations throughout

## What's Been Implemented (Feb 8, 2026)
- [x] Stage 1: SVG gift box with floating animation, glow, click-to-open
- [x] Stage 2: ML-powered AI game with sentence-transformers backend
  - RoseClassifier trained on 508 semantic samples, 20 epochs
  - 5-class classification: yes/no/close/i don't know/too far away
  - 20-question limit, Ask + Guess buttons
  - Confidence/progress bar, typing animations
- [x] Stage 3: Yellow sundrop flower photo reveal with:
  - Golden glow effect, firefly particles
  - Hanging tag with customizable message
  - Reveal sound effect
- [x] Twinkling star background across all stages
- [x] Smooth stage transitions with fade/scale animations
- [x] Sound effects (click, reveal)
- [x] Mobile responsive (tested 375x812)
- [x] Glassmorphism cards, pulsing AI orb
- [x] All data-testid attributes for testability

## Backlog
- P1: Add ambient background music option
- P1: Add "play again" button on Stage 3
- P2: Custom flower image upload option
- P2: Share button (generate shareable link)
- P3: Multiple language support

## Next Tasks
- Allow tag text customization from UI
- Add share-to-social feature
- Background ambient audio option
