# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev         # Start Vite development server with hot reload
npm run build       # Type check with tsc and build production bundle
npm run lint        # Run ESLint for code quality checks  
npm run preview     # Preview production build locally
npm run deploy      # Build and deploy to Vercel production
```

## Architecture Overview

**TastyShot** is a PWA photo editing app that captures and enhances photos using Google Gemini 2.5 Flash Image Preview model via direct API integration.

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with inline styles for Leica-inspired UI
- **PWA**: vite-plugin-pwa for offline support and installability
- **API**: Vercel serverless functions (`/api/gemini.js` and `/api/replicate.js`)
- **AI Model**: Google Gemini 2.5 Flash Image Preview for image processing

### Key Components

**App Flow**: `CameraInterface` → captures photo → `PhotoEditor` → AI enhancement → `PhotoHistory`

- `src/App.tsx`: Main component managing view state (camera/editing/history) and photo data flow
- `src/components/Camera/CameraInterface.tsx`: Camera access via getUserMedia API with iOS optimizations
- `src/components/Editor/PhotoEditor.tsx`: AI editing interface with Gemini integration and compare slider
- `src/services/gemini.ts`: Client-side service calling `/api/gemini` endpoint
- `src/hooks/useGemini.ts`: React hook for Gemini AI operations

### API Integration

**NEW**: Direct client-side API integration (based on proven gembooth implementation):
1. Client calls `src/services/gemini.ts` which uses `@google/genai` library directly
2. No serverless functions needed - direct API calls to Google Gemini
3. Uses `VITE_GEMINI_API_KEY` environment variable for client-side access
4. Includes retry logic, rate limiting, and proper error handling

**Legacy**: Serverless proxy pattern for Replicate (still available):
1. Client calls `src/services/replicate.ts` 
2. Service posts to `/api/replicate` endpoint
3. Serverless function handles the API call

### Environment Variables

For local development (.env.local):
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (AIza...) - **REQUIRED**
- `REPLICATE_API_TOKEN`: Your Replicate API token (r8_...) - optional, for legacy support

For production (Vercel dashboard):
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (AIza...) - **REQUIRED**
- `REPLICATE_API_TOKEN`: Your Replicate API token (r8_...) - optional, for legacy support

## Critical Implementation Details

### AI Model Configuration
Model is Google Gemini 2.5 Flash Image Preview with these parameters:
- `model`: 'gemini-2.5-flash-image-preview'
- `temperature`: 1.0
- `maxOutputTokens`: 8192  
- `topP`: 0.95

### Error Handling
- All API calls wrapped in try-catch with detailed logging
- User-friendly error messages displayed via error overlay
- Console logging preserved for debugging in `/api/replicate.js`

### Mobile/PWA Considerations  
- HTTPS required for camera access
- Service worker caching for offline functionality
- iOS-specific camera optimizations in `CameraInterface`
- Responsive design with mobile-first approach

## Testing Approach

No automated tests configured. Manual testing checklist:
1. Camera access on various devices
2. All AI models process successfully  
3. PWA installation and offline mode
4. Error states and network failures
5. Mobile responsiveness

## Deployment

Auto-deploys to Vercel on push to `main` branch. Manual deploy:
```bash
npm run deploy
```

Vercel configuration in `vercel.json` handles:
- Service worker headers for PWA
- API route rewrites  
- Security headers (X-Frame-Options, CSP, etc.)
- Cache control to prevent stale updates