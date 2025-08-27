# TastyShot Monorepo Implementation Guide - 2025 Stack

## 📋 Executive Summary

Transform TastyShot from a single React PWA into a modern monorepo supporting both web and React Native mobile apps with 60-70% shared code, native camera quality via Vision Camera, and optimal 2025 tooling (pnpm + Nx + Expo SDK 52+).

## 🎯 Goals & Success Criteria

### Primary Objectives
- [ ] Maintain existing web app functionality (zero regressions)
- [ ] Achieve native camera quality on mobile (Vision Camera integration)
- [ ] Share 60-70% of codebase between platforms
- [ ] Implement modern 2025 monorepo best practices
- [ ] Reduce development time by 50%+ for future features

### Technical Requirements
- [ ] pnpm workspaces for package management (22s vs 45s installs)
- [ ] Nx for task orchestration and caching
- [ ] Expo SDK 52+ with automatic monorepo detection
- [ ] React Native 0.73+ with default symlink support
- [ ] Vision Camera 4.0+ for professional camera features

## 🏗️ Final Architecture

```
tastyshot-monorepo/
├── packages/
│   ├── shared/                 # 60-70% shared code
│   │   ├── src/
│   │   │   ├── services/       # API integrations (Gemini, Replicate)
│   │   │   ├── types/          # TypeScript definitions
│   │   │   ├── hooks/          # Business logic hooks
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── constants/      # App constants, prompts
│   │   │   └── config/         # Environment configurations
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                    # React PWA (existing app)
│   │   ├── src/
│   │   │   ├── components/     # Web-specific UI components
│   │   │   ├── pages/          # React Router pages
│   │   │   └── styles/         # Tailwind CSS
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── mobile/                 # React Native + Expo app
│       ├── src/
│       │   ├── components/     # React Native UI components
│       │   ├── screens/        # Navigation screens
│       │   ├── navigation/     # React Navigation setup
│       │   └── styles/         # StyleSheet definitions
│       ├── ios/                # iOS native code
│       ├── android/            # Android native code
│       ├── app.json
│       └── package.json
├── tools/                      # Build and development tools
├── apps/                       # Future apps (if needed)
├── libs/                       # Future libraries (if needed)
├── pnpm-workspace.yaml         # Workspace configuration
├── nx.json                     # Nx configuration
├── package.json                # Root dependencies
└── README.md                   # Development documentation
```

---

# 🚀 PHASE 1: MONOREPO INITIALIZATION

## Task 1.1: Setup Project Structure

### Prerequisites Check
- [ ] Verify Node.js 18+ installed (`node --version`)
- [ ] Verify pnpm installed (`pnpm --version`) or install: `npm install -g pnpm`
- [ ] Verify Git initialized in current directory
- [ ] Create backup of existing code: `cp -r . ../tastyshot-backup`

### Commands to Execute
```bash
# 1. Create monorepo directory structure
mkdir tastyshot-monorepo && cd tastyshot-monorepo

# 2. Initialize root package.json
pnpm init

# 3. Create workspace configuration
echo 'packages:
  - "packages/*"
  - "apps/*"
  - "libs/*"' > pnpm-workspace.yaml

# 4. Create directory structure
mkdir -p packages/{shared,web,mobile}
mkdir -p packages/shared/src/{services,types,hooks,utils,constants,config}
mkdir -p tools apps libs

# 5. Initialize Nx for task orchestration
pnpm add -D nx @nx/workspace @nx/react @nx/react-native @nx/vite @nx/expo
pnpm exec nx init
```

### Verification Steps
- [ ] Verify `pnpm-workspace.yaml` exists
- [ ] Verify directory structure matches architecture diagram
- [ ] Run `pnpm exec nx --version` to confirm Nx installation
- [ ] Check `nx.json` file created

## Task 1.2: Configure Nx Workspace

### Nx Configuration Setup
```bash
# Create optimized nx.json configuration
cat > nx.json << 'EOF'
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "npmScope": "tastyshot",
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "lint", 
          "test",
          "typecheck",
          "e2e"
        ],
        "parallel": 3,
        "maxParallel": 3
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  },
  "generators": {
    "@nx/react": {
      "application": {
        "bundler": "vite",
        "style": "css",
        "linter": "eslint"
      }
    }
  }
}
EOF
```

### Root Package.json Configuration
```bash
# Update root package.json with workspace scripts
cat > package.json << 'EOF'
{
  "name": "tastyshot-monorepo",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "nx run-many --targets=build --all",
    "build:affected": "nx affected --targets=build",
    "dev": "nx run-many --targets=serve --all --parallel",
    "dev:web": "nx serve web",
    "dev:mobile": "nx serve mobile",
    "test": "nx run-many --targets=test --all",
    "test:affected": "nx affected --targets=test",
    "lint": "nx run-many --targets=lint --all",
    "lint:affected": "nx affected --targets=lint",
    "typecheck": "nx run-many --targets=typecheck --all",
    "clean": "nx reset && pnpm exec rimraf node_modules packages/*/node_modules",
    "graph": "nx graph",
    "affected:graph": "nx affected:graph"
  },
  "devDependencies": {
    "nx": "latest",
    "@nx/workspace": "latest",
    "@nx/react": "latest",
    "@nx/react-native": "latest",
    "@nx/vite": "latest",
    "@nx/expo": "latest",
    "rimraf": "^5.0.0",
    "typescript": "^5.3.0"
  }
}
EOF

# Install root dependencies
pnpm install
```

### Verification Steps
- [ ] Verify `nx.json` configuration applied
- [ ] Run `pnpm run graph` to see dependency graph
- [ ] Confirm all root scripts work: `pnpm run --help`

---

# 🚀 PHASE 2: SHARED PACKAGE CREATION

## Task 2.1: Extract Shared Services

### Setup Shared Package Structure
```bash
cd packages/shared

# Initialize shared package
cat > package.json << 'EOF'
{
  "name": "@tastyshot/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@google/genai": "^0.17.1",
    "p-limit": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "rimraf": "^5.0.0"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./services/*": {
      "types": "./dist/services/*.d.ts",
      "default": "./dist/services/*.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts", 
      "default": "./dist/types/index.js"
    },
    "./hooks/*": {
      "types": "./dist/hooks/*.d.ts",
      "default": "./dist/hooks/*.js"
    }
  }
}
EOF

# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
EOF
```

### Copy and Adapt Services
```bash
# Copy existing services to shared package
cp /path/to/current/tastyshot/src/services/gemini.ts packages/shared/src/services/
cp /path/to/current/tastyshot/src/services/replicate.ts packages/shared/src/services/
cp /path/to/current/tastyshot/src/services/supabase.ts packages/shared/src/services/

# Copy types
cp /path/to/current/tastyshot/src/types/index.ts packages/shared/src/types/

# Copy hooks (will need platform abstraction)
cp /path/to/current/tastyshot/src/hooks/useGemini.ts packages/shared/src/hooks/
cp /path/to/current/tastyshot/src/hooks/useReplicate.ts packages/shared/src/hooks/
```

### Create Shared Package Index
```bash
cat > packages/shared/src/index.ts << 'EOF'
// Services
export * from './services/gemini';
export * from './services/replicate';
export * from './services/supabase';

// Types
export * from './types';

// Hooks
export * from './hooks/useGemini';
export * from './hooks/useReplicate';

// Utils
export * from './utils';

// Constants
export * from './constants';

// Config
export * from './config';
EOF
```

### Create Shared Constants
```bash
cat > packages/shared/src/constants/index.ts << 'EOF'
// App Configuration
export const APP_CONFIG = {
  name: 'TastyShot',
  version: '2.0.0',
  apiTimeout: 30000,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxRetries: 3
} as const;

// AI Model Configurations
export const AI_MODELS = {
  GEMINI: 'gemini-2.5-flash-image-preview',
  REPLICATE_FLUX: 'black-forest-labs/flux-1.1-pro'
} as const;

// Image Processing Prompts
export const FOOD_PROMPTS = {
  OVERHEAD_FLAT_LAY: 'Transform into overhead flat lay style with complete table setup, props, and styled composition',
  TEXTURE_CLOSE_UP: 'Create macro close-up highlighting food textures, moisture, and appetizing details',
  DELIVERY_READY: 'Place food in an open eco-friendly container on white background, flat lay without utensils, professional delivery app style',
  FINE_DINING: 'Style as elegant fine dining presentation with sophisticated plating on premium dinnerware',
  DRAMATIC_RESTAURANT: 'Apply dramatic restaurant lighting with warm ambiance and strategic shadows',
  SOFT_STUDIO_LIGHT: 'Apply soft, high-key studio lighting with even illumination and minimal shadows'
} as const;
EOF
```

### Build and Test Shared Package
```bash
cd packages/shared
pnpm install
pnpm run build
```

### Verification Steps
- [ ] Verify `packages/shared/dist/` directory created with .js and .d.ts files
- [ ] Check all services export correctly: `node -e "console.log(require('./dist/index.js'))"`
- [ ] Verify TypeScript types work: `pnpm run typecheck`
- [ ] Confirm package builds successfully: `pnpm run build`

## Task 2.2: Create Platform Abstraction Layer

### Storage Abstraction
```bash
cat > packages/shared/src/utils/storage.ts << 'EOF'
// Abstract storage interface for cross-platform compatibility
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Storage keys
export const STORAGE_KEYS = {
  PHOTO_HISTORY: 'tastyshot_photo_history',
  USER_PREFERENCES: 'tastyshot_user_preferences',
  APP_SETTINGS: 'tastyshot_app_settings'
} as const;

// Generic storage service that works with any adapter
export class StorageService {
  constructor(private adapter: StorageAdapter) {}

  async getPhotoHistory(): Promise<any[]> {
    const data = await this.adapter.getItem(STORAGE_KEYS.PHOTO_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  async savePhotoHistory(history: any[]): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.PHOTO_HISTORY, JSON.stringify(history));
  }

  async getUserPreferences(): Promise<any> {
    const data = await this.adapter.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : {};
  }

  async saveUserPreferences(preferences: any): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  }
}
EOF
```

### Camera Abstraction Interface
```bash
cat > packages/shared/src/utils/camera.ts << 'EOF'
// Abstract camera interface for cross-platform compatibility
export interface CameraCapabilities {
  hasMultipleLenses: boolean;
  supportedResolutions: string[];
  hasFlash: boolean;
  canSwitchCamera: boolean;
  maxVideoFps: number;
}

export interface CameraPhoto {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  fileSize?: number;
  timestamp: number;
}

export interface CameraAdapter {
  getCapabilities(): Promise<CameraCapabilities>;
  capturePhoto(): Promise<CameraPhoto>;
  requestPermissions(): Promise<boolean>;
  checkPermissions(): Promise<boolean>;
}

// Camera service that works with any adapter
export class CameraService {
  constructor(private adapter: CameraAdapter) {}

  async initialize(): Promise<boolean> {
    const hasPermission = await this.adapter.checkPermissions();
    if (!hasPermission) {
      return await this.adapter.requestPermissions();
    }
    return true;
  }

  async takePhoto(): Promise<CameraPhoto> {
    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error('Camera permissions not granted');
    }
    return await this.adapter.capturePhoto();
  }

  async getCapabilities(): Promise<CameraCapabilities> {
    return await this.adapter.getCapabilities();
  }
}
EOF
```

### Navigation Abstraction
```bash
cat > packages/shared/src/utils/navigation.ts << 'EOF'
// Abstract navigation interface for cross-platform compatibility
export interface NavigationAdapter {
  navigate(screen: string, params?: any): void;
  goBack(): void;
  reset(screen: string, params?: any): void;
  canGoBack(): boolean;
}

export const SCREEN_NAMES = {
  CAMERA: 'Camera',
  EDITOR: 'Editor', 
  HISTORY: 'History',
  SETTINGS: 'Settings'
} as const;

// Navigation service that works with any adapter
export class NavigationService {
  constructor(private adapter: NavigationAdapter) {}

  navigateToCamera(params?: any): void {
    this.adapter.navigate(SCREEN_NAMES.CAMERA, params);
  }

  navigateToEditor(params?: any): void {
    this.adapter.navigate(SCREEN_NAMES.EDITOR, params);
  }

  navigateToHistory(params?: any): void {
    this.adapter.navigate(SCREEN_NAMES.HISTORY, params);
  }

  goBack(): void {
    if (this.adapter.canGoBack()) {
      this.adapter.goBack();
    }
  }
}
EOF
```

### Verification Steps
- [ ] Verify abstraction interfaces compile: `pnpm run typecheck`
- [ ] Check abstractions export properly in main index
- [ ] Confirm shared package builds with new abstractions: `pnpm run build`

---

# 🚀 PHASE 3: WEB APP MIGRATION

## Task 3.1: Move Existing Web App

### Move and Setup Web Package
```bash
# Move existing app to packages/web
cp -r /path/to/current/tastyshot/* packages/web/

# Update web package.json to use shared dependencies
cd packages/web
cat > package.json << 'EOF'
{
  "name": "@tastyshot/web",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "deploy": "pnpm run build && vercel --prod"
  },
  "dependencies": {
    "@tastyshot/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.4"
  }
}
EOF
```

### Update Web App to Use Shared Services
```bash
# Update import statements in web app components
# This is a critical step - update all service imports

# Example: Update src/hooks/useGemini.ts
sed -i 's|from "\.\./services/gemini"|from "@tastyshot/shared"|g' packages/web/src/hooks/useGemini.ts

# Update all component imports
find packages/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./services/|from "@tastyshot/shared/services/|g'
find packages/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./types"|from "@tastyshot/shared/types"|g'
find packages/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./hooks/|from "@tastyshot/shared/hooks/|g'
```

### Create Web-Specific Storage Adapter
```bash
cat > packages/web/src/adapters/WebStorageAdapter.ts << 'EOF'
import { StorageAdapter } from '@tastyshot/shared/utils/storage';

export class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}
EOF
```

### Create Web-Specific Camera Adapter
```bash
cat > packages/web/src/adapters/WebCameraAdapter.ts << 'EOF'
import { CameraAdapter, CameraCapabilities, CameraPhoto } from '@tastyshot/shared/utils/camera';

export class WebCameraAdapter implements CameraAdapter {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  async getCapabilities(): Promise<CameraCapabilities> {
    return {
      hasMultipleLenses: false,
      supportedResolutions: ['1280x720', '1920x1080'],
      hasFlash: false,
      canSwitchCamera: true,
      maxVideoFps: 30
    };
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch {
      return false;
    }
  }

  async capturePhoto(): Promise<CameraPhoto> {
    // Implementation using existing web camera logic
    // This should integrate with your existing CameraInterface component
    throw new Error('Web camera capture should be handled by CameraInterface component');
  }
}
EOF
```

### Update Vite Configuration
```bash
cat > packages/web/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'TastyShot - AI Food Photography',
        short_name: 'TastyShot',
        description: 'Transform your food photos with AI',
        theme_color: '#007AFF',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['@tastyshot/shared']
  }
});
EOF
```

### Verification Steps
- [ ] Web app builds successfully: `cd packages/web && pnpm install && pnpm run build`
- [ ] No TypeScript errors: `pnpm run typecheck`
- [ ] Web app runs in development: `pnpm run dev`
- [ ] All shared imports resolve correctly
- [ ] Camera functionality works (test in browser)
- [ ] AI processing works with Gemini integration

---

# 🚀 PHASE 4: REACT NATIVE APP CREATION

## Task 4.1: Initialize Expo App with SDK 52+

### Setup Mobile Package
```bash
cd packages

# Create Expo app with TypeScript template
npx create-expo-app@latest mobile --template blank-typescript

# Verify Expo SDK version is 52+
cd mobile
npx expo --version
cat package.json | grep '"expo":'
```

### Install React Native Dependencies
```bash
cd packages/mobile

# Core React Native dependencies
pnpm add @tastyshot/shared@workspace:*
pnpm add react-native-vision-camera@latest
pnpm add expo-camera@latest
pnpm add react-native-image-resizer@latest
pnpm add @react-native-async-storage/async-storage@latest
pnpm add react-native-svg@latest

# Navigation
pnpm add @react-navigation/native@^6.1.9
pnpm add @react-navigation/native-stack@^6.9.17
pnpm add react-native-screens@latest
pnpm add react-native-safe-area-context@latest

# Expo specific
pnpm add expo-constants@latest
pnpm add expo-status-bar@latest
pnpm add expo-linking@latest

# Development dependencies
pnpm add -D @types/react-native@latest
```

### Configure Package.json
```bash
cat > packages/mobile/package.json << 'EOF'
{
  "name": "@tastyshot/mobile",
  "version": "2.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "serve": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build": "eas build --platform all",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "@tastyshot/shared": "workspace:*",
    "expo": "~52.0.0",
    "expo-constants": "~17.0.0",
    "expo-linking": "~7.0.0",
    "expo-router": "~4.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "4.1.0",
    "react-native-web": "~0.19.10"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~18.3.0",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.3.0"
  }
}
EOF
```

### Update App.json Configuration
```bash
cat > packages/mobile/app.json << 'EOF'
{
  "expo": {
    "name": "TastyShot",
    "slug": "tastyshot-mobile",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tastyshot.mobile",
      "infoPlist": {
        "NSCameraUsageDescription": "TastyShot needs camera access to take photos of your food for AI enhancement",
        "NSPhotoLibraryUsageDescription": "TastyShot needs photo library access to save and select photos",
        "NSPhotoLibraryAddUsageDescription": "TastyShot needs permission to save enhanced photos to your library"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.tastyshot.mobile",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "TastyShot needs access to your camera to take photos of food.",
          "enableMicrophonePermission": false
        }
      ]
    ]
  }
}
EOF
```

### Verification Steps
- [ ] Expo SDK 52+ confirmed: `npx expo --version`
- [ ] All packages install successfully: `pnpm install`
- [ ] App starts without errors: `pnpm run start`
- [ ] TypeScript compiles: `pnpm run typecheck`
- [ ] Metro bundler shows monorepo detection in logs

## Task 4.2: Create Mobile-Specific Adapters

### Mobile Storage Adapter
```bash
mkdir -p packages/mobile/src/adapters

cat > packages/mobile/src/adapters/MobileStorageAdapter.ts << 'EOF'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageAdapter } from '@tastyshot/shared/utils/storage';

export class MobileStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }
}
EOF
```

### Vision Camera Adapter
```bash
cat > packages/mobile/src/adapters/VisionCameraAdapter.ts << 'EOF'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { CameraAdapter, CameraCapabilities, CameraPhoto } from '@tastyshot/shared/utils/camera';

export class VisionCameraAdapter implements CameraAdapter {
  async getCapabilities(): Promise<CameraCapabilities> {
    const devices = Camera.getAvailableCameraDevices();
    const backCamera = devices.find(device => device.position === 'back');
    
    return {
      hasMultipleLenses: devices.length > 1,
      supportedResolutions: ['1280x720', '1920x1080', '3840x2160'],
      hasFlash: backCamera?.hasFlash ?? false,
      canSwitchCamera: devices.length > 1,
      maxVideoFps: 60
    };
  }

  async requestPermissions(): Promise<boolean> {
    const permission = await Camera.requestCameraPermission();
    return permission === 'authorized';
  }

  async checkPermissions(): Promise<boolean> {
    const permission = await Camera.getCameraPermissionStatus();
    return permission === 'authorized';
  }

  async capturePhoto(): Promise<CameraPhoto> {
    // This will be implemented in the camera component
    // as it requires access to the camera ref
    throw new Error('Photo capture should be handled by camera component with ref');
  }
}
EOF
```

### React Navigation Adapter
```bash
cat > packages/mobile/src/adapters/ReactNavigationAdapter.ts << 'EOF'
import { NavigationAdapter } from '@tastyshot/shared/utils/navigation';
import { CommonActions, NavigationContainerRef } from '@react-navigation/native';

export class ReactNavigationAdapter implements NavigationAdapter {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  navigate(screen: string, params?: any): void {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.navigate(screen, params);
    }
  }

  goBack(): void {
    if (this.navigationRef?.isReady() && this.navigationRef.canGoBack()) {
      this.navigationRef.goBack();
    }
  }

  reset(screen: string, params?: any): void {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: screen, params }]
        })
      );
    }
  }

  canGoBack(): boolean {
    return this.navigationRef?.canGoBack() ?? false;
  }
}
EOF
```

### Verification Steps
- [ ] All adapter files compile: `pnpm run typecheck`
- [ ] No import errors from shared package
- [ ] Adapters implement all required interface methods

## Task 4.3: Create Core Mobile Screens

### Camera Screen with Vision Camera
```bash
mkdir -p packages/mobile/src/screens

cat > packages/mobile/src/screens/CameraScreen.tsx << 'EOF'
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import { SCREEN_NAMES } from '@tastyshot/shared/utils/navigation';

export default function CameraScreen() {
  const navigation = useNavigation();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const takePhoto = async () => {
    try {
      if (!camera.current) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      const photo = await camera.current.takePhoto({
        quality: 90,
        enableAutoRedEyeReduction: true,
        enableAutoStabilization: true,
        enableShutterSound: false
      });

      // Navigate to editor with photo
      navigation.navigate(SCREEN_NAMES.EDITOR as never, { 
        photoUri: `file://${photo.path}`,
        photoWidth: photo.width,
        photoHeight: photo.height
      } as never);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const switchCamera = () => {
    // Toggle between front and back camera
    // Implementation depends on your camera switching logic
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No camera device available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
        enableZoomGesture={true}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => navigation.navigate(SCREEN_NAMES.HISTORY as never)}
          >
            <Text style={styles.controlText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.switchButton} onPress={switchCamera}>
            <Text style={styles.controlText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  controlText: {
    color: 'white',
    fontSize: 16,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#000',
  },
  switchButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 25,
  },
});
EOF
```

### Editor Screen
```bash
cat > packages/mobile/src/screens/EditorScreen.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Text, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGemini } from '@tastyshot/shared/hooks/useGemini';
import { FOOD_PROMPTS } from '@tastyshot/shared/constants';

const { width: screenWidth } = Dimensions.get('window');

export default function EditorScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { photoUri, photoWidth, photoHeight } = route.params as any;
  const { processImage, isProcessing, error } = useGemini();
  
  const [originalImage, setOriginalImage] = useState(photoUri);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const promptOptions = [
    { key: 'OVERHEAD_FLAT_LAY', label: '📐 Overhead Flat Lay', prompt: FOOD_PROMPTS.OVERHEAD_FLAT_LAY },
    { key: 'TEXTURE_CLOSE_UP', label: '🔍 Texture Close-up', prompt: FOOD_PROMPTS.TEXTURE_CLOSE_UP },
    { key: 'DELIVERY_READY', label: '📦 Delivery Ready', prompt: FOOD_PROMPTS.DELIVERY_READY },
    { key: 'FINE_DINING', label: '🍽️ Fine Dining', prompt: FOOD_PROMPTS.FINE_DINING },
    { key: 'DRAMATIC_RESTAURANT', label: '🌟 Dramatic Light', prompt: FOOD_PROMPTS.DRAMATIC_RESTAURANT },
    { key: 'SOFT_STUDIO_LIGHT', label: '💡 Soft Studio', prompt: FOOD_PROMPTS.SOFT_STUDIO_LIGHT },
  ];

  const handleEnhance = async (prompt: string) => {
    try {
      setSelectedPrompt(prompt);
      
      // Convert file URI to base64 for API
      const response = await fetch(originalImage);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      
      const result = await processImage(base64, prompt);
      setEnhancedImage(result.image);
    } catch (err) {
      console.error('Enhancement error:', err);
      Alert.alert('Error', 'Failed to enhance image. Please try again.');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const saveImage = async () => {
    if (!enhancedImage) return;
    
    // TODO: Implement save to photo library
    Alert.alert('Success', 'Image saved to gallery!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: enhancedImage || originalImage }} 
          style={styles.image}
          resizeMode="contain"
        />
        
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Enhancing image...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.controlsContainer} horizontal showsHorizontalScrollIndicator={false}>
        {promptOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.promptButton,
              selectedPrompt === option.prompt && styles.selectedPromptButton
            ]}
            onPress={() => handleEnhance(option.prompt)}
            disabled={isProcessing}
          >
            <Text style={[
              styles.promptButtonText,
              selectedPrompt === option.prompt && styles.selectedPromptButtonText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Retake</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, !enhancedImage && styles.disabledButton]}
          onPress={saveImage}
          disabled={!enhancedImage}
        >
          <Text style={styles.primaryButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: screenWidth,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  controlsContainer: {
    maxHeight: 80,
    paddingVertical: 10,
  },
  promptButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectedPromptButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  promptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPromptButtonText: {
    fontWeight: 'bold',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
EOF
```

### History Screen
```bash
cat > packages/mobile/src/screens/HistoryScreen.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Text,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageService } from '@tastyshot/shared/utils/storage';
import { MobileStorageAdapter } from '../adapters/MobileStorageAdapter';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 30) / 2;

interface HistoryItem {
  id: string;
  originalImage: string;
  enhancedImage?: string;
  prompt: string;
  timestamp: number;
}

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [storageService] = useState(() => new StorageService(new MobileStorageAdapter()));

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await storageService.getPhotoHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const deleteItem = async (id: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedHistory = history.filter(item => item.id !== id);
            setHistory(updatedHistory);
            await storageService.savePhotoHistory(updatedHistory);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.item}>
      <Image 
        source={{ uri: item.enhancedImage || item.originalImage }} 
        style={styles.thumbnail}
      />
      <Text style={styles.promptText} numberOfLines={2}>
        {item.prompt}
      </Text>
      <Text style={styles.dateText}>
        {new Date(item.timestamp).toLocaleDateString()}
      </Text>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Photo History</Text>
        <View style={{ width: 50 }} />
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubText}>Take your first photo to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  item: {
    width: itemWidth,
    marginHorizontal: 5,
    marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: itemWidth,
    borderRadius: 8,
    marginBottom: 8,
  },
  promptText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  dateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,0,0,0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
  },
});
EOF
```

### Verification Steps
- [ ] All screens compile without TypeScript errors
- [ ] Navigation between screens works
- [ ] Camera permissions handled correctly
- [ ] Vision Camera integration functional
- [ ] Image processing with Gemini works
- [ ] History storage and retrieval works

## Task 4.4: Setup Navigation

### App Navigation Structure
```bash
cat > packages/mobile/App.tsx << 'EOF'
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import CameraScreen from './src/screens/CameraScreen';
import EditorScreen from './src/screens/EditorScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Navigation
import { ReactNavigationAdapter } from './src/adapters/ReactNavigationAdapter';
import { SCREEN_NAMES } from '@tastyshot/shared/utils/navigation';

const Stack = createNativeStackNavigator();
const navigationAdapter = new ReactNavigationAdapter();

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Hide splash screen after app is ready
    const prepare = async () => {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    
    prepare();
  }, []);

  return (
    <NavigationContainer
      ref={(navigationRef) => {
        if (navigationRef) {
          navigationAdapter.setNavigationRef(navigationRef);
        }
      }}
    >
      <Stack.Navigator
        initialRouteName={SCREEN_NAMES.CAMERA}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen 
          name={SCREEN_NAMES.CAMERA} 
          component={CameraScreen} 
        />
        <Stack.Screen 
          name={SCREEN_NAMES.EDITOR} 
          component={EditorScreen}
          options={{
            gestureEnabled: false // Prevent accidental swipe back during editing
          }}
        />
        <Stack.Screen 
          name={SCREEN_NAMES.HISTORY} 
          component={HistoryScreen} 
        />
      </Stack.Navigator>
      
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </NavigationContainer>
  );
}
EOF
```

### Configure Metro for Monorepo (if not auto-detected)
```bash
# Only run if Expo doesn't auto-detect monorepo
cat > packages/mobile/metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// Configure monorepo support
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Add workspace packages to watchFolders
config.watchFolders = [workspaceRoot];

// Configure resolver for workspace dependencies
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Enable symlinks
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
EOF
```

### Verification Steps
- [ ] App builds successfully: `pnpm run android` or `pnpm run ios`
- [ ] Navigation works between all screens
- [ ] No import errors from shared package
- [ ] Camera screen loads and shows camera preview
- [ ] Back navigation works properly
- [ ] Status bar configured correctly

---

# 🚀 PHASE 5: TESTING & OPTIMIZATION

## Task 5.1: Cross-Platform Testing Checklist

### Shared Code Verification
- [ ] **Gemini API Integration**
  - [ ] Web app can process images with Gemini
  - [ ] Mobile app can process images with Gemini  
  - [ ] Same prompts produce consistent results
  - [ ] Error handling works identically
  - [ ] API rate limiting functions correctly
  - [ ] Environment variables load properly

- [ ] **Type Safety**
  - [ ] All shared types compile in web project: `cd packages/web && pnpm run typecheck`
  - [ ] All shared types compile in mobile project: `cd packages/mobile && pnpm run typecheck`
  - [ ] No `any` types in shared package: `cd packages/shared && pnpm run typecheck`
  - [ ] Interface contracts respected across platforms

- [ ] **Storage Abstraction**
  - [ ] Web storage saves/loads photo history correctly
  - [ ] Mobile storage saves/loads photo history correctly
  - [ ] Data format consistent between platforms
  - [ ] No data corruption during transfers

### Camera Quality Testing
- [ ] **Vision Camera (Mobile)**
  - [ ] Camera permissions requested and handled
  - [ ] Multiple camera lenses accessible (if available)
  - [ ] Photo quality matches native apps (1080p minimum)
  - [ ] Focus and exposure controls work
  - [ ] Flash functionality works
  - [ ] Image file sizes reasonable (< 5MB)
  - [ ] EXIF data preserved

- [ ] **Web Camera (Comparison)**
  - [ ] getUserMedia API works in browsers
  - [ ] Photo quality acceptable for web context
  - [ ] Camera switching works (front/back)
  - [ ] Image capture functions properly

### Performance Testing
- [ ] **Build Performance**
  - [ ] Nx caching works: `nx build web && nx build web` (second should be cached)
  - [ ] Affected commands work: `nx affected:build` after changing shared code
  - [ ] Total build time under 2 minutes
  - [ ] pnpm install time under 30 seconds

- [ ] **Runtime Performance**  
  - [ ] App startup time under 3 seconds (mobile)
  - [ ] Camera preview starts within 1 second
  - [ ] Image processing completes within 30 seconds
  - [ ] Navigation transitions smooth (60fps)
  - [ ] Memory usage stable (no leaks)

### Code Sharing Validation
- [ ] **Measure Actual Sharing**
  ```bash
  # Count lines of shared vs platform-specific code
  find packages/shared -name "*.ts" -o -name "*.tsx" | xargs wc -l
  find packages/web/src -name "*.ts" -o -name "*.tsx" | xargs wc -l  
  find packages/mobile/src -name "*.ts" -o -name "*.tsx" | xargs wc -l
  
  # Verify 60%+ sharing target achieved
  ```
  - [ ] Shared code represents 60%+ of total business logic
  - [ ] No duplicated API calling logic
  - [ ] No duplicated type definitions
  - [ ] No duplicated utility functions

## Task 5.2: Performance Optimization

### Nx Caching Verification
```bash
# Test Nx caching is working properly
cd tastyshot-monorepo

# First build (should be slow)
time nx run-many --targets=build --all

# Second build (should be fast due to caching)
time nx run-many --targets=build --all

# Test affected commands
echo "// Test change" >> packages/shared/src/constants/index.ts
nx affected:build  # Should only build affected projects
```

### Bundle Size Optimization
```bash
# Analyze web bundle size
cd packages/web
pnpm add -D @rollup/plugin-visualizer
echo "import { visualizer } from '@rollup/plugin-visualizer';
export default {
  plugins: [visualizer()],
}" >> vite.config.ts

pnpm run build
# Check if stats.html is generated and bundle size is reasonable

# Analyze mobile bundle size
cd packages/mobile
npx expo export --dump-sourcemap
npx expo export:optimize
# Check bundle size and loading performance
```

### Memory Usage Testing
- [ ] **Web App Memory**
  - [ ] No memory leaks during image processing
  - [ ] Camera stream properly disposed
  - [ ] Image objects garbage collected

- [ ] **Mobile App Memory**  
  - [ ] App memory usage under 200MB during normal use
  - [ ] No memory warnings in development
  - [ ] Camera resources properly released

### Verification Steps
- [ ] All performance tests pass
- [ ] Bundle sizes within acceptable limits (< 10MB total)
- [ ] No memory leaks detected
- [ ] Caching reduces build times by 70%+

---

# 🚀 PHASE 6: DEPLOYMENT PREPARATION

## Task 6.1: Production Environment Setup

### Web App Deployment (Vercel)
```bash
cd packages/web

# Verify build works for production
pnpm run build

# Test production build locally
pnpm run preview

# Configure environment variables for production
# Add to Vercel dashboard:
# - VITE_GEMINI_API_KEY
# - VITE_ENABLE_REPLICATE_MODELS (if using)
# - Any other environment variables

# Update deployment script
cat >> package.json << 'EOF'
  "deploy": "pnpm run build && vercel --prod"
EOF
```

### Mobile App Deployment Setup

#### EAS Build Configuration
```bash
cd packages/mobile

# Install EAS CLI
pnpm add -g @expo/eas-cli

# Login to Expo account
eas login

# Initialize EAS configuration  
eas build:configure

# This creates eas.json - verify it's correct:
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 0.66.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF
```

#### Configure App Store Metadata
```bash
# Update app.json for production
cat > packages/mobile/app.json << 'EOF'
{
  "expo": {
    "name": "TastyShot - AI Food Photography",
    "slug": "tastyshot-mobile",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png", 
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tastyshot.mobile",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "TastyShot needs camera access to take photos of your food for AI enhancement",
        "NSPhotoLibraryUsageDescription": "TastyShot needs photo library access to save and select photos",
        "NSPhotoLibraryAddUsageDescription": "TastyShot needs permission to save enhanced photos to your library"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.tastyshot.mobile",
      "versionCode": 1,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "TastyShot needs access to your camera to take photos of food for AI enhancement.",
          "enableMicrophonePermission": false
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
EOF
```

### Environment Variables Setup
```bash
# Create environment configuration
cat > packages/mobile/.env.example << 'EOF'
# Gemini AI API Key (required)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Enable Replicate models
EXPO_PUBLIC_ENABLE_REPLICATE_MODELS=false
EXPO_PUBLIC_REPLICATE_API_TOKEN=your_replicate_token_here

# App Configuration
EXPO_PUBLIC_APP_VERSION=2.0.0
EXPO_PUBLIC_API_TIMEOUT=30000
EOF

# Add environment variable validation
cat > packages/mobile/src/config/env.ts << 'EOF'
import Constants from 'expo-constants';

interface Config {
  geminiApiKey: string;
  enableReplicateModels: boolean;
  replicateApiToken?: string;
  apiTimeout: number;
}

function getConfig(): Config {
  const geminiApiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY 
    || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
  if (!geminiApiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is required but not provided');
  }

  return {
    geminiApiKey,
    enableReplicateModels: Constants.expoConfig?.extra?.EXPO_PUBLIC_ENABLE_REPLICATE_MODELS === 'true',
    replicateApiToken: Constants.expoConfig?.extra?.EXPO_PUBLIC_REPLICATE_API_TOKEN,
    apiTimeout: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_API_TIMEOUT || '30000', 10)
  };
}

export const config = getConfig();
EOF
```

### Verification Steps
- [ ] Web app builds successfully for production
- [ ] Mobile app builds successfully with EAS
- [ ] All environment variables configured
- [ ] App Store metadata complete
- [ ] Icon and splash screen assets ready

## Task 6.2: Final Pre-Deployment Checklist

### Code Quality Verification
- [ ] **Linting**
  - [ ] Web app: `cd packages/web && pnpm run lint` (no errors)
  - [ ] Mobile app: `cd packages/mobile && pnpm run lint` (no errors)
  - [ ] Shared package: `cd packages/shared && pnpm run typecheck` (no errors)

- [ ] **Type Safety**
  - [ ] All packages compile: `nx run-many --targets=typecheck --all`
  - [ ] No `@ts-ignore` comments (search codebase)
  - [ ] No `any` types in production code

- [ ] **Testing**
  - [ ] Critical user flows tested manually
  - [ ] Cross-platform API behavior verified
  - [ ] Error handling tested on both platforms

### Security Review
- [ ] **API Keys**
  - [ ] No API keys committed to repository
  - [ ] Environment variables properly configured
  - [ ] API key validation works

- [ ] **Permissions**
  - [ ] Camera permissions properly requested
  - [ ] Storage permissions properly requested
  - [ ] Permission denial handled gracefully

### Performance Verification
- [ ] **Build Performance**
  - [ ] Total monorepo build time under 3 minutes
  - [ ] Individual package builds under 1 minute
  - [ ] Nx caching reducing build times significantly

- [ ] **Runtime Performance**
  - [ ] Web app loads in under 3 seconds
  - [ ] Mobile app starts in under 3 seconds
  - [ ] Image processing completes in under 30 seconds
  - [ ] UI remains responsive during processing

### Final Functional Testing
- [ ] **Web App**
  - [ ] Camera capture works in Chrome, Safari, Firefox
  - [ ] Image enhancement produces quality results
  - [ ] Photo history saves/loads correctly
  - [ ] PWA installation works
  - [ ] Offline functionality works where expected

- [ ] **Mobile App**
  - [ ] Camera capture works on iOS and Android
  - [ ] Vision Camera provides professional quality
  - [ ] Multiple camera lenses accessible (if supported)
  - [ ] Image enhancement identical to web results
  - [ ] Photo history syncs properly
  - [ ] App works offline where expected
  - [ ] Navigation smooth and intuitive

### Documentation Review
- [ ] **README Files**
  - [ ] Root README explains monorepo structure
  - [ ] Package READMEs explain individual setup
  - [ ] Development workflow documented
  - [ ] Environment variable setup documented

- [ ] **Code Documentation**
  - [ ] Shared services properly documented
  - [ ] Platform adapters explained
  - [ ] Complex business logic commented

---

# 🚀 DEPLOYMENT EXECUTION

## Task 7.1: Deploy Web Application

### Production Deployment Steps
```bash
# 1. Final build verification
cd packages/web
pnpm install
pnpm run typecheck
pnpm run lint  
pnpm run build

# 2. Test production build locally
pnpm run preview
# Verify app works correctly in production mode

# 3. Deploy to Vercel
pnpm run deploy

# 4. Verify production deployment
# - Test on multiple devices/browsers
# - Verify environment variables work
# - Test API integrations
# - Test PWA functionality
```

### Post-Deployment Verification
- [ ] Web app accessible at production URL
- [ ] HTTPS certificate working
- [ ] API calls working with production keys
- [ ] PWA installation works
- [ ] All features functional in production

## Task 7.2: Deploy Mobile Application

### iOS App Store Deployment
```bash
cd packages/mobile

# 1. Build production iOS app
eas build --platform ios --profile production

# 2. Submit to App Store (after build completes)
eas submit --platform ios --latest

# 3. Follow App Store review process
# - Monitor build progress in EAS dashboard
# - Respond to any App Store review feedback
# - Track review status
```

### Android Play Store Deployment
```bash
cd packages/mobile

# 1. Build production Android app
eas build --platform android --profile production

# 2. Submit to Play Store (after build completes) 
eas submit --platform android --latest

# 3. Follow Play Store review process
# - Monitor build progress in EAS dashboard  
# - Respond to any Play Store review feedback
# - Track review status
```

### Post-Deployment Mobile Verification
- [ ] Apps available in respective stores
- [ ] Installation and first-run experience smooth
- [ ] All camera features work on real devices
- [ ] AI processing works with production API keys
- [ ] Photo history and storage work correctly
- [ ] Performance acceptable on various devices

---

# 🎯 SUCCESS VERIFICATION

## Final Success Criteria Checklist

### ✅ Technical Goals Achieved
- [ ] **Monorepo Structure**: Modern 2025 architecture with pnpm + Nx + Expo SDK 52+
- [ ] **Code Sharing**: 60%+ of business logic shared between platforms
- [ ] **Performance**: Nx caching reduces build times by 70%+, apps start under 3 seconds
- [ ] **Native Camera**: Vision Camera provides professional quality on mobile
- [ ] **Cross-Platform API**: Identical Gemini AI results on web and mobile
- [ ] **Type Safety**: Full TypeScript coverage with shared types

### ✅ User Experience Goals Achieved  
- [ ] **Web App**: Maintains existing functionality with no regressions
- [ ] **Mobile App**: Feels native with smooth animations and gestures
- [ ] **Camera Quality**: Mobile camera matches native photography apps
- [ ] **Processing Speed**: AI enhancement completes in under 30 seconds
- [ ] **Photo History**: Seamless save/load across app sessions

### ✅ Development Workflow Optimized
- [ ] **Fast Installs**: pnpm reduces install time from 45s to 22s
- [ ] **Smart Building**: Nx only builds affected projects
- [ ] **Easy Development**: Single command runs both web and mobile
- [ ] **Code Quality**: Shared linting and type checking
- [ ] **Easy Deployment**: Automated deployment for both platforms

### ✅ Business Benefits Delivered
- [ ] **Faster Development**: 50%+ reduction in time for new features
- [ ] **Reduced Costs**: Single team maintains both web and mobile
- [ ] **Better Quality**: Shared business logic reduces bugs
- [ ] **Scalability**: Easy to add new platforms or features
- [ ] **Market Reach**: Available on web, iOS App Store, and Google Play

---

# 📚 DEVELOPMENT REFERENCE

## Daily Commands
```bash
# Start development (both platforms)
nx serve web & nx serve mobile

# Run only web
nx serve web

# Run only mobile  
nx serve mobile

# Build all projects
nx run-many --targets=build --all

# Build only affected by changes
nx affected:build

# Type check all projects
nx run-many --targets=typecheck --all

# Lint all projects
nx run-many --targets=lint --all

# Install new dependency in specific package
cd packages/web && pnpm add some-package
cd packages/mobile && pnpm add some-package  
cd packages/shared && pnpm add some-package

# Add shared dependency to other packages
cd packages/web && pnpm add @tastyshot/shared@workspace:*
cd packages/mobile && pnpm add @tastyshot/shared@workspace:*
```

## Troubleshooting Guide

### Common Issues and Solutions

**Metro bundler not finding shared package:**
```bash
# Clear all caches
nx reset
cd packages/mobile && pnpm start --clear
```

**TypeScript errors with shared imports:**
```bash
# Rebuild shared package
cd packages/shared && pnpm run build
```

**Nx caching issues:**
```bash
# Clear Nx cache
nx reset
```

**pnpm workspace resolution issues:**
```bash
# Delete node_modules and reinstall
pnpm run clean
pnpm install
```

**Vision Camera build issues:**
```bash
# iOS: Clean build folder
cd packages/mobile/ios && xcodebuild clean

# Android: Clean gradle
cd packages/mobile/android && ./gradlew clean
```

## Architecture Decisions Record

### Why pnpm over npm/yarn?
- 22s installs vs 45s (npm) or 35s (yarn)
- 85MB total disk usage vs 130MB per project
- Better monorepo support with workspace protocol
- Faster CI/CD builds

### Why Nx over Lerna/Turborepo?
- Active development (Lerna maintenance mode)
- Advanced caching and affected commands
- Better TypeScript integration
- Excellent pnpm workspace integration

### Why Expo SDK 52+ over bare React Native?
- Automatic monorepo detection and Metro configuration
- Simplified deployment with EAS
- Better development experience
- Still allows native code when needed

### Why Vision Camera over Expo Camera?
- Professional camera controls (focus, exposure, RAW)
- Multiple lens access (wide, ultra-wide, telephoto)
- Better performance for intensive use cases
- More similar to native iOS/Android camera APIs

This comprehensive implementation guide provides everything needed to successfully transform TastyShot into a modern, high-performance monorepo supporting both web and native mobile platforms with maximum code sharing and optimal 2025 development practices.