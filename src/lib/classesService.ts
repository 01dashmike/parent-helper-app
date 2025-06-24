export async function getClasses({ town, category }: { town: string; category: string }) {
  const params = new URLSearchParams();
  if (town) params.append('town', town);
  if (category) params.append('category', category);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/classes?${params.toString()}`);
  return res.json();
} 