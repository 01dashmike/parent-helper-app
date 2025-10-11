import { createClient } from '@supabase/supabase-js';

export const onRequestGet: PagesFunction = async (ctx) => {
  const url = ctx.env.PUBLIC_SUPABASE_URL;
  const serviceKey = ctx.env.SUPABASE_SERVICE_ROLE;
  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase.from('classes').select('*').limit(10);
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ data });
};
