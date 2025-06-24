import { supabase } from './supabaseClient';

export async function fetchClassesByTown(townName) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .ilike('town', `%${townName}%`); // Case-insensitive match

  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }

  return data;
}