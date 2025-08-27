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

**TastyShot** is a PWA photo editing app that captures and enhances photos using AI models via Replicate API.

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with inline styles for Leica-inspired UI
- **PWA**: vite-plugin-pwa for offline support and installability
- **API**: Vercel serverless functions (`/api/gemini.js` and `/api/replicate.js`)
- **AI Models**: Google Gemini 2.0 Flash and Imagen3 for image processing and generation

### Key Components

**App Flow**: `CameraInterface` → captures photo → `PhotoEditor` → AI enhancement → `PhotoHistory`

- `src/App.tsx`: Main component managing view state (camera/editing/history) and photo data flow
- `src/components/Camera/CameraInterface.tsx`: Camera access via getUserMedia API with iOS optimizations
- `src/components/Editor/PhotoEditor.tsx`: AI editing interface with Gemini integration and compare slider
- `src/services/gemini.ts`: Client-side service calling `/api/gemini` endpoint
- `src/hooks/useGemini.ts`: React hook for Gemini AI operations

### API Integration

The app uses a serverless proxy pattern to avoid CORS and protect API keys:
1. Client calls `src/services/gemini.ts` or `src/services/replicate.ts` (legacy)
2. Service posts to `/api/gemini` or `/api/replicate` endpoint  
3. Serverless function uses Google Generative AI client with `GEMINI_API_KEY` env var
4. Returns processed results with base64-encoded images or URLs

### Environment Variables

Required in Vercel dashboard:
- `GEMINI_API_KEY`: Your Google Gemini API key (AIza...)
- `REPLICATE_API_TOKEN`: Your Replicate API token (r8_...) - optional, for legacy support

## Critical Implementation Details

### AI Model Configuration
Default model is Google Gemini 2.0 Flash with these parameters:
- `temperature`: 1.0
- `maxOutputTokens`: 8192  
- `topP`: 0.95
- Secondary model: Imagen3 for text-to-image generation

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