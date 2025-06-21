import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
