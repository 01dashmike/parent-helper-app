import { supabase, fetchClasses, searchClassesSupabase } from './supabaseClient';

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
    const data = await fetchClasses(townName);
    
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
    const data = await searchClassesSupabase(searchParams);
    
    if (data && data.length > 0) {
      console.log('Supabase search returned', data.length, 'classes');
      return data;
    } else {
      console.log('No results from Supabase, trying API fallback');
      return searchClassesAPI(searchParams);
    }
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