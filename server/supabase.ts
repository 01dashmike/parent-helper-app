import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabase = createClient(
  'https://mxvqkpefheroaailfpnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dnFrcGVmaGVyb2FhaWxmcG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTIzMTMsImV4cCI6MjA2NTQ4ODMxM30.Xd07hOWUe4F0G6xng7ToL-_o8XN9DEM1AKEwvPZ0l7w'
);

// Database types for TypeScript
export interface Class {
  id: number;
  name: string;
  description: string | null;
  venue: string | null;
  town: string | null;
  postcode: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  age_group_min: number | null;
  age_group_max: number | null;
  category: string | null;
  price: string | null;
  day_of_week: string | null;
  time: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_featured: boolean;
  rating: string | null;
  review_count: number | null;
  popularity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassFilters {
  town?: string;
  category?: string;
  ageGroup?: 'baby' | 'toddler' | 'preschool';
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 