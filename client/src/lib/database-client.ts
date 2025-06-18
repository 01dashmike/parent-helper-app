// Database client for searching classes
interface SearchParams {
  postcode?: string;
  className?: string;
  ageGroup?: string;
  category?: string;
  dayOfWeek?: string;
  radius?: number;
}

export async function fetchClassesByTown(townName: string) {
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
    console.error('Error fetching classes:', error);
    return [];
  }
}

export async function searchClasses(searchParams: SearchParams) {
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
    console.error('Error searching classes:', error);
    return [];
  }
}