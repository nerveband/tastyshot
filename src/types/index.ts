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

export interface ReplicateModelSettings {
  prompt: string;
  aspect_ratio?: string;
  go_fast?: boolean;
  seed?: number;
  output_format?: string;
  output_quality?: number;
  disable_safety_checker?: boolean;
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