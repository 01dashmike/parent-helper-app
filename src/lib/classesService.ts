const mockClasses = [
  {
    id: 1,
    class_name: 'Baby Sensory',
    venue: 'Community Hall',
    description: 'A fun sensory class for babies.'
  },
  {
    id: 2,
    class_name: 'Toddler Music',
    venue: 'Music Room',
    description: 'Interactive music sessions for toddlers.'
  }
];

// Accepts town/category for future use, but unused in mock mode
export async function getClasses(_: { town?: string; category?: string }) {
  // ✅ Mock data for development (comment this block out when going live)
  if (process.env.NODE_ENV === 'development') {
    return mockClasses;
  }

  // 🌐 Live API fetch (uncomment when backend is ready)
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`);
  // const data = await res.json();
  // return data;
} 