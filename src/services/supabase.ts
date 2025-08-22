import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication functions
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database functions for future credit system
export const db = {
  // User profile functions
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateUserCredits: async (userId: string, credits: number) => {
    const { data, error } = await supabase
      .from('users')
      .update({ credits })
      .eq('id', userId)
      .select();
    return { data, error };
  },

  // Photo history functions
  savePhoto: async (photoData: any) => {
    const { data, error } = await supabase
      .from('photos')
      .insert([photoData])
      .select();
    return { data, error };
  },

  getUserPhotos: async (userId: string) => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updatePhotoStatus: async (photoId: string, status: string, editedUrl?: string) => {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (editedUrl) {
      updateData.edited_url = editedUrl;
    }

    const { data, error } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', photoId)
      .select();
    return { data, error };
  },

  // Credit transaction functions (Phase 2)
  recordCreditTransaction: async (transactionData: any) => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert([transactionData])
      .select();
    return { data, error };
  },
};

// Storage functions
export const storage = {
  uploadPhoto: async (file: File, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file);
    return { data, error };
  },

  getPublicUrl: (fileName: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);
    return data.publicUrl;
  },

  deletePhoto: async (fileName: string) => {
    const { data, error } = await supabase.storage
      .from('photos')
      .remove([fileName]);
    return { data, error };
  },
};