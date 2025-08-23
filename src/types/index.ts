// User and authentication types
export interface User {
  id: string;
  email: string;
  credits: number;
  created_at: string;
}

// Photo and editing types
export interface Photo {
  id: string;
  user_id: string;
  original_url: string;
  edited_url?: string;
  prompt: string;
  model_settings: ReplicateModelSettings;
  cost: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Base model settings interface
export interface BaseModelSettings {
  prompt: string;
  seed?: number;
}

// SeedEdit 3.0 specific settings
export interface SeedEditSettings extends BaseModelSettings {
  guidance_scale?: number;
  negative_prompt?: string;
  num_inference_steps?: number;
}

// Flux Kontext settings
export interface FluxKontextSettings extends BaseModelSettings {
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
}

// Qwen Image Edit settings
export interface QwenImageEditSettings extends BaseModelSettings {
  num_inference_steps?: number;
  guidance_scale?: number;
}

// Union type for all model settings
export type ReplicateModelSettings = SeedEditSettings | FluxKontextSettings | QwenImageEditSettings;

// Model information interface
export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'image-editing' | 'image-generation' | 'upscaling';
  replicateModel: string; // The actual model identifier for Replicate API
  supportedInputs: ('camera' | 'upload')[];
  defaultSettings: ReplicateModelSettings;
  maxImageSize?: number;
  estimatedTime?: string;
  cost: number;
}

export interface UpscaleSettings {
  upscale_factor: 'x2' | 'x4';
  compression_quality: number;
}

// Camera types
export interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment' | { ideal: 'user' | 'environment' };
    width: number | { ideal: number; max?: number };
    height: number | { ideal: number; max?: number };
    frameRate?: number | { ideal: number; max?: number };
  };
}

// API Response types
export interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  urls?: {
    stream?: string;
  };
  output?: string[];
  error?: string;
}

// UI State types
export interface AppState {
  isLoading: boolean;
  error: string | null;
  currentView: 'camera' | 'editing' | 'history';
  capturedImage: string | null;
  editedImage: string | null;
}

// Credit system types (Phase 2)
export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund';
  description: string;
  created_at: string;
}

export interface EditingPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  cost: number;
}