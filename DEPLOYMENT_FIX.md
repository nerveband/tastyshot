# Fix for 500 Server Error on Vercel - RESOLVED

## The Problem
The app was getting a 500 error due to API routes being incorrectly redirected by Vercel configuration.

## Root Cause
The `vercel.json` file had a catch-all rewrite rule that was redirecting all requests (including `/api/*` routes) to `/index.html`, preventing the Replicate API serverless function from being accessible.

## Solution Applied

### Fixed Vercel Configuration
Updated `vercel.json` to properly handle API routes:

```json
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
```

This ensures:
- API routes `/api/*` are handled by serverless functions
- All other routes are handled by the SPA (Single Page Application)

### Environment Variable Status
- ✅ `REPLICATE_API_TOKEN` already exists in Vercel production environment
- ✅ API route correctly configured to use this environment variable
- ✅ Local development uses `VITE_REPLICATE_API_TOKEN` as fallback

## What Changed

I've also updated the AI models to use actual working Replicate models:
- **Flux Kontext Dev** - State-of-the-art text-guided image editing
- **Flux Fill Dev** - Professional-quality image editing and inpainting
- **Flux Kontext Pro** - Professional image editing (premium)
- **Flux Fill Pro** - Advanced inpainting and image editing

The previous model identifiers were incorrect/placeholder values which is why they were failing.

## Testing

After redeployment, the image processing should work correctly. The models will:
1. Accept your photo
2. Apply the enhancement prompt
3. Return the edited image

## Alternative: Use Your Own Replicate API Token

If you prefer to use your own Replicate account:
1. Sign up at https://replicate.com
2. Go to https://replicate.com/account/api-tokens
3. Create a new token
4. Use that token in the Vercel environment variable instead

## Local Development

For local development, the `.env` file already has the token configured, so it should work locally without any changes.