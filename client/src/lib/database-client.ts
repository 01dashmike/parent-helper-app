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

interface SearchParams {
  postcode?: string;
  className?: string;
  ageGroup?: string;
  category?: string;
  dayOfWeek?: string;
  radius?: number;
}

interface Class {
  id: number;
  name: string;
  description: string;
  ageGroupMin: number;
  ageGroupMax: number;
  price: string | null;
  venue: string;
  address: string;
  postcode: string;
  town: string;
  dayOfWeek: string;
  time: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  category: string;
  rating?: string;
  reviewCount?: number;
  isActive: boolean;
}

export async function fetchClassesByTown(townName: string): Promise<Class[]> {
  try {
    if (!supabase) {
      console.log('Using PostgreSQL API fallback');
      return fetchClassesByTownAPI(townName);
    }

    console.log('Querying Supabase for town:', townName);
    const { data, error } = await supabase!
      .from('classes')
      .select('*')
      .ilike('town', `%${townName}%`)
      .eq('isActive', true)
      .limit(20);

    if (error) {
      console.error('Supabase error:', error);
      return fetchClassesByTownAPI(townName);
    }

    console.log('Supabase returned', data?.length || 0, 'classes');
    return data || [];
  } catch (error) {
    console.error('Error fetching classes from Supabase:', error);
    return fetchClassesByTownAPI(townName);
  }
}

export async function searchClasses(searchParams: SearchParams): Promise<Class[]> {
  try {
    if (!supabase) {
      console.log('Using PostgreSQL API fallback for search');
      return searchClassesAPI(searchParams);
    }

    console.log('Searching Supabase with params:', searchParams);

    let query = supabase!
      .from('classes')
      .select('*')
      .eq('isActive', true);

    // Filter by postcode or town
    if (searchParams.postcode) {
      const searchTerm = searchParams.postcode.toLowerCase();
      // Check if it looks like a postcode
      const isPostcode = /^[a-z]{1,2}\d/.test(searchTerm);
      
      if (isPostcode) {
        query = query.ilike('postcode', `${searchTerm}%`);
      } else {
        query = query.ilike('town', `%${searchTerm}%`);
      }
    }

    // Filter by class name
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
      return searchClassesAPI(searchParams);
    }

    console.log('Supabase search returned', data?.length || 0, 'classes');
    return data || [];
  } catch (error) {
    console.error('Error searching classes with Supabase:', error);
    return searchClassesAPI(searchParams);
  }
}

// Fallback API functions
async function fetchClassesByTownAPI(townName: string): Promise<Class[]> {
  try {
    const response = await fetch(`/api/classes/search?postcode=${encodeURIComponent(townName)}&radius=15`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching classes from API:', error);
    return [];
  }
}

async function searchClassesAPI(searchParams: SearchParams): Promise<Class[]> {
  try {
    const params = new URLSearchParams();
    
    if (searchParams.postcode) params.append('postcode', searchParams.postcode);
    if (searchParams.className) params.append('className', searchParams.className);
    if (searchParams.ageGroup) params.append('ageGroup', searchParams.ageGroup);
    if (searchParams.category) params.append('category', searchParams.category);
    if (searchParams.dayOfWeek) params.append('dayOfWeek', searchParams.dayOfWeek);
    if (searchParams.radius) params.append('radius', searchParams.radius.toString());
    
    const response = await fetch(`/api/classes/search?${params.toString()}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error searching classes via API:', error);
    return [];
  }
}