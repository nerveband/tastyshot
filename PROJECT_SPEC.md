# TastyShot PWA - Project Specification

## Project Overview

TastyShot is a Progressive Web Application (PWA) designed for instant food photography enhancement using AI-powered image editing models. The app provides a camera interface for capturing food photos and applies professional-quality enhancements through various AI models via the Replicate API.

## Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS-in-JS (inline styles)
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin with Workbox
- **API**: Vercel Serverless Functions
- **AI Models**: Replicate API integration
- **Deployment**: Vercel
- **Version Control**: GitHub

### Project Structure
```
tastyshot/
├── api/
│   └── replicate.js           # Serverless function for Replicate API calls
├── public/
│   ├── manifest.json          # PWA manifest
│   └── [icons/images]         # PWA icons and assets
├── src/
│   ├── components/
│   │   ├── Camera/
│   │   │   └── CameraInterface.tsx    # Main camera component
│   │   ├── Editor/
│   │   │   └── PhotoEditor.tsx        # Photo editing interface
│   │   └── UI/
│   │       └── IconMap.tsx            # Icon mapping component
│   ├── services/
│   │   └── replicate.ts              # Client-side Replicate service
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── App.tsx                       # Main app component
│   └── main.tsx                      # App entry point
├── vercel.json                       # Vercel configuration
├── vite.config.ts                   # Vite configuration
└── package.json                     # Dependencies and scripts
```

## Core Features

### 1. Camera Interface
- **Component**: `src/components/Camera/CameraInterface.tsx`
- **Features**:
  - Live camera feed access via `getUserMedia()`
  - Centered capture button with absolute positioning
  - Clean icon interface without background boxes
  - Support for both front and back cameras
  - Real-time video preview

### 2. AI-Powered Image Enhancement
- **Service**: `src/services/replicate.ts`
- **Supported Models** (in priority order):
  1. **SeedEdit 3.0** (Default) - `bytedance/seededit-3.0`
  2. **Flux Kontext Max** - `black-forest-labs/flux-kontext-max`
  3. **Flux Krea Dev** - `black-forest-labs/flux-krea-dev`
  4. **Flux Kontext Pro** - `black-forest-labs/flux-kontext-pro`
  5. **Qwen Image Edit** - `qwen/qwen-image-edit`

### 3. Progressive Web App
- **Manifest**: `/public/manifest.json`
- **Service Worker**: Auto-generated via Vite PWA plugin
- **Offline Support**: Cached assets and basic functionality
- **Install Prompt**: Native app-like experience

## API Integration

### Replicate API Service
- **Server-side Handler**: `/api/replicate.js`
- **Client-side Service**: `src/services/replicate.ts`
- **Authentication**: Environment variable `REPLICATE_API_TOKEN`
- **CORS**: Properly configured for cross-origin requests

### Model Input Structure
```typescript
interface ModelInput {
  image: string;                    // Base64 or URL
  prompt: string;                   // Enhancement prompt
  guidance_scale: number;           // Model guidance (3.5 default, 5.5 for SeedEdit)
  num_inference_steps: number;      // Processing steps (25-28)
  width: number;                    // Output width (1024)
  height: number;                   // Output height (1024)
  seed?: number;                    // Random seed for reproducibility
}
```

## Environment Setup

### Required Environment Variables
```bash
# Vercel Environment Variables
REPLICATE_API_TOKEN=r8_your_token_here
VITE_REPLICATE_API_TOKEN=r8_your_token_here  # Backup compatibility
```

### Development Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "lucide-react": "latest",
    "replicate": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "latest",
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "vite-plugin-pwa": "latest"
  }
}
```

## Build and Deployment

### Build Commands
```bash
npm install          # Install dependencies
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

### Vercel Configuration
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

## Implementation Guidelines

### 1. Component Development
- Use functional components with TypeScript
- Implement proper prop typing with interfaces
- Use inline styles for component styling
- Follow React hooks best practices

### 2. Error Handling
- Implement comprehensive try-catch blocks
- Provide user-friendly error messages
- Log detailed errors for debugging
- Handle network connectivity issues

### 3. Performance Optimization
- Lazy load components where appropriate
- Optimize image processing workflows
- Implement proper loading states
- Cache API responses when possible

### 4. Mobile Optimization
- Ensure responsive design for all screen sizes
- Optimize touch interactions for mobile devices
- Handle device orientation changes
- Test on various mobile browsers

## AI Model Configuration

### Default Model (SeedEdit 3.0)
```typescript
{
  id: 'seededit-30',
  name: 'SeedEdit 3.0',
  description: 'Fast and high-quality generative image editing preserving details while making targeted edits',
  provider: 'ByteDance',
  replicateModel: 'bytedance/seededit-3.0',
  defaultSettings: {
    guidance_scale: 5.5,
    num_inference_steps: 25,
  },
  estimatedTime: '20-30 seconds',
  cost: 2
}
```

### Enhancement Presets
The app includes predefined editing presets:
- **ENHANCE**: General quality improvement
- **DRAMATIC**: Cinematic lighting effects
- **VINTAGE**: Film-style appearance
- **B&W**: Black and white conversion
- **PRO EDIT**: Studio lighting
- **SUNSET**: Golden hour effects

## Security Considerations

### API Security
- Never expose API tokens in client-side code
- Use server-side proxy for all Replicate API calls
- Implement proper CORS headers
- Validate all user inputs

### Image Processing
- Sanitize uploaded images
- Implement file size limits
- Validate image formats
- Handle malicious uploads gracefully

## Testing Requirements

### Manual Testing Checklist
- [ ] Camera access works on all supported devices
- [ ] Image capture functions correctly
- [ ] All AI models process images successfully
- [ ] PWA installation works
- [ ] Offline functionality operates as expected
- [ ] Mobile responsiveness across devices
- [ ] Error states display properly

### Browser Compatibility
- Chrome/Chromium 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment Process

### GitHub Integration
1. Push code to `main` branch
2. Automatic Vercel deployment triggers
3. Build process runs TypeScript compilation and Vite build
4. PWA service worker generates automatically
5. Production deployment goes live

### Manual Deployment
```bash
git add -A
git commit -m "feat: description of changes"
git push origin main
vercel --prod
```

## Troubleshooting Common Issues

### 500 Server Errors
- Check `REPLICATE_API_TOKEN` environment variable
- Verify API route configuration in `vercel.json`
- Check server logs for detailed error messages

### Camera Access Issues
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Verify `getUserMedia()` API support

### Build Failures
- Run `npm run build` locally to test
- Check TypeScript compilation errors
- Verify all imports and dependencies

## Future Enhancement Opportunities

### Potential Features
- User accounts and photo history
- Batch processing capabilities
- Custom model fine-tuning
- Social sharing integration
- Advanced editing controls
- Photo comparison views

### Performance Improvements
- Image compression optimization
- Caching strategy enhancement
- Progressive loading implementation
- WebAssembly integration for client-side processing

## Contact and Support

For technical questions or issues:
- Check GitHub repository issues
- Review Vercel deployment logs
- Consult Replicate API documentation
- Test with minimal reproducible examples

---

*This specification document should be sufficient for any AI coder to rebuild or extend the TastyShot PWA with complete functionality and proper architecture.*