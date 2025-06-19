import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate and clean up the URL
let validSupabaseUrl = '';
let validSupabaseKey = '';

if (supabaseUrl && supabaseAnonKey) {
  // Clean up URL - remove quotes and ensure proper format
  validSupabaseUrl = supabaseUrl.replace(/^["']|["']$/g, '').trim();
  validSupabaseKey = supabaseAnonKey.replace(/^["']|["']$/g, '').trim();
  
  // Validate URL format
  try {
    new URL(validSupabaseUrl);
  } catch (error) {
    console.error('Invalid Supabase URL format:', validSupabaseUrl);
    validSupabaseUrl = '';
  }
} else {
  console.log('Supabase credentials not provided, using PostgreSQL API fallback');
}

export const supabase = validSupabaseUrl && validSupabaseKey 
  ? createClient(validSupabaseUrl, validSupabaseKey)
  : null;

export async function fetchClasses(searchTerm: string) {
  if (!supabase) {
    console.log('Supabase not available, using API fallback');
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .ilike('town_name', `%${searchTerm}%`);

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  return data || [];
}

export async function searchClassesSupabase(searchParams: any) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('classes')
    .select('*');

  // Search by town name or postcode
  if (searchParams.postcode) {
    const searchTerm = searchParams.postcode.toLowerCase();
    const isPostcode = /^[a-z]{1,2}\d/.test(searchTerm);
    
    if (isPostcode) {
      query = query.ilike('postcode', `${searchTerm}%`);
    } else {
      query = query.or(`town_name.ilike.%${searchTerm}%,town.ilike.%${searchTerm}%`);
    }
  }

  // Search by class name
  if (searchParams.className) {
    query = query.or(`name.ilike.%${searchParams.className}%,description.ilike.%${searchParams.className}%`);
  }

  // Filter by category
  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category', searchParams.category);
  }

  // Filter by day of week
  if (searchParams.dayOfWeek && searchParams.dayOfWeek !== 'all') {
    query = query.eq('dayOfWeek', searchParams.dayOfWeek);
  }

  // Apply radius-based limiting
  const radius = searchParams.radius || 10;
  let limit = 20;
  if (radius <= 3) limit = 8;
  else if (radius <= 7) limit = 12;
  else if (radius <= 15) limit = 18;

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Supabase search error:', error);
    return [];
  }

  return data || [];
}