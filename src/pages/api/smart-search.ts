import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxvqkpefheroaailfpnc.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dnFrcGVmaGVyb2FhaWxmcG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTIzMTMsImV4cCI6MjA2NTQ4ODMxM30.Xd07hOWUe4F0G6xng7ToL-_o8XN9DEM1AKEwvPZ0l7w'
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;

  if (typeof q !== "string" || !q.trim()) {
    return res.status(400).json({ error: "Missing or invalid query" });
  }

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .ilike("name", `%${q}%`);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}// trigger redeploy
