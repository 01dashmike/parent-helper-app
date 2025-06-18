import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchClassesByTown(townName) {
  const { data, error } = await supabase
    .from('Classes')
    .select('*')
    .ilike('town', `%${townName}%`); // Case-insensitive match

  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }

  return data;
}