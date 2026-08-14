# Project Plan

## Project
SATURNX — The Smart Scheme Intelligence Engine

## Problem
Citizens are unaware of or unable to navigate government welfare and scholarship schemes. 
The process from eligibility to approval is fragmented, confusing, and inaccessible.

## Solution
SATURNX helps citizens discover, prepare, and apply for government benefits through:
1. Conversational profile building (voice or text)
2. Transparent eligibility matching (no black boxes)
3. Prerequisite and document tracking (Scheme Cascade)
4. Browser-side document preparation (SmartDoc Studio)
5. Application readiness and rejection analysis

## Tech Stack
- Frontend: Next.js 16.3.1 (App Router), React, TypeScript
- Styling: Tailwind CSS v4, shadcn/ui (Base UI)
- Database: Supabase PostgreSQL
- State: React Context API
- Icons: Lucide React
- Image Processing: HTML5 Canvas (browser-side)
- Calendar: Browser-generated ICS files
- Deployment: Vercel (free tier)

## Core Features

### Voice Onboarding
Browser-native webkitSpeechRecognition + deterministic regex parser.
Extracts: age, income, state, occupation, education, caste category.

### Benefit Intelligence Engine
Transparent weighted scoring:
- Income 30%, State 20%, Education 20%, Category 15%, Occupation 10%, Deadline 5%
Shows exactly why a user matches or doesn't match each scheme.

### Scheme Cascade
Visual dependency roadmap showing prerequisite → document → application chain.
Application unlocks only when all prerequisites are complete.

### SmartDoc Studio
100% browser-side image processing:
- Resize to exactly 200×230px
- Compress below 50KB
- Preview before/after
- Download processed image

### Application Readiness & Rejection Analyzer
Shows what's missing, with deterministic corrective actions for rejected applications.

### Family Benefit Graph
Per-member opportunity and benefit calculation across the household.

### AI Assistant
Rule-based intent detection (no paid LLM, no RAG):
- Benefits, documents, deadlines, eligibility, applications

## Development Phases

### Phase 0 — Foundation ✅
- [x] Project setup (Next.js, Tailwind, shadcn/ui)
- [x] Global layout and navigation
- [x] Reusable UI components

### Phase 1 — Database & Seed ✅
- [x] Supabase schema
- [x] Seed data (demo user + 5 schemes)
- [x] Demo mode

### Phase 2-12 — Core Features ✅
- [x] Landing page
- [x] Voice/text onboarding
- [x] Benefit matching engine
- [x] Dashboard
- [x] Benefits page
- [x] Scheme detail page
- [x] Scheme Cascade
- [x] Family benefits
- [x] Document vault
- [x] SmartDoc Studio
- [x] Applications + Rejection Analyzer
- [x] Calendar/Deadlines (.ics)
- [x] AI Assistant

### Phase 13 — QA & Polish
- [ ] Full demo flow testing
- [ ] Mobile responsiveness check
- [ ] Supabase setup documentation

## Hackathon Goals
- Complete demo flow: Onboarding → Dashboard → Scheme → Cascade → SmartDoc → Applications
- Zero infrastructure cost (free tier + browser-side processing)
- No paid AI APIs
- Works without DigiLocker/Aadhaar integration

## Demo Requirements
1. Try Demo button on landing page
2. Voice/text onboarding creates profile
3. Dashboard shows potential benefit total
4. Scheme page shows eligibility explanation
5. Cascade shows prerequisite roadmap
6. SmartDoc compresses photo to 200×230 < 50KB
7. Applications shows rejected application with corrective action
8. Calendar downloads .ics deadline file
