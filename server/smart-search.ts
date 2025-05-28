// Smart search functionality that understands natural language queries
export interface SmartSearchResult {
  category?: string;
  ageGroup?: string;
  keywords: string[];
  searchType: 'specific' | 'category' | 'general';
}

export function parseSmartSearch(query: string): SmartSearchResult {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Define category mappings
  const categoryMappings = {
    swimming: ['swimming', 'swim', 'water babies', 'aqua', 'pool'],
    music: ['music', 'sing', 'singing', 'song', 'musical', 'instruments', 'monkey music'],
    sensory: ['sensory', 'baby sensory', 'toddler sense', 'senses', 'messy play'],
    movement: ['movement', 'yoga', 'gym', 'tumble tots', 'tots play', 'dance', 'ballet'],
    language: ['sign', 'signing', 'language', 'communication', 'makaton'],
    art: ['art', 'craft', 'creative', 'painting', 'drawing', 'messy'],
    massage: ['massage', 'baby massage', 'relaxation'],
    education: ['education', 'learning', 'development', 'school readiness']
  };
  
  // Define age group mappings
  const ageGroupMappings = {
    '0-6': ['newborn', 'baby', 'infant', '0-6', 'under 6 months'],
    '6-12': ['older baby', '6-12', '6 months', 'sitting baby'],
    '1-2': ['toddler', '1 year', '2 year', '12-24', 'walking'],
    '2-3': ['2 year', '3 year', 'preschool', 'young child'],
    '3-5': ['3 year', '4 year', '5 year', 'school age', 'nursery age']
  };
  
  // Find matching categories
  let detectedCategory: string | undefined;
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
      detectedCategory = category;
      break;
    }
  }
  
  // Find matching age groups
  let detectedAgeGroup: string | undefined;
  for (const [ageGroup, keywords] of Object.entries(ageGroupMappings)) {
    if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
      detectedAgeGroup = ageGroup;
      break;
    }
  }
  
  // Extract keywords for text search
  const keywords = lowercaseQuery
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['for', 'the', 'and', 'with', 'near', 'classes', 'class'].includes(word));
  
  // Determine search type
  let searchType: 'specific' | 'category' | 'general' = 'general';
  if (detectedCategory) {
    searchType = 'category';
  }
  if (keywords.some(keyword => ['baby sensory', 'water babies', 'monkey music', 'tumble tots'].some(brand => brand.includes(keyword)))) {
    searchType = 'specific';
  }
  
  return {
    category: detectedCategory,
    ageGroup: detectedAgeGroup,
    keywords,
    searchType
  };
}

// Enhanced search query builder
export function buildSmartSearchQuery(searchResult: SmartSearchResult, postcode?: string) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  // Category filter
  if (searchResult.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(searchResult.category);
    paramIndex++;
  }
  
  // Age group filter - convert to age ranges
  if (searchResult.ageGroup) {
    const ageRanges = {
      '0-6': [0, 6],
      '6-12': [6, 12],
      '1-2': [12, 24],
      '2-3': [24, 36],
      '3-5': [36, 60]
    };
    
    const [minAge, maxAge] = ageRanges[searchResult.ageGroup as keyof typeof ageRanges] || [0, 60];
    conditions.push(`(age_group_min <= $${paramIndex} AND age_group_max >= $${paramIndex + 1})`);
    params.push(maxAge, minAge);
    paramIndex += 2;
  }
  
  // Keyword search in name, description, and venue
  if (searchResult.keywords.length > 0) {
    const keywordConditions = searchResult.keywords.map(() => {
      const condition = `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1} OR venue ILIKE $${paramIndex + 2})`;
      params.push(`%${searchResult.keywords[params.length / 3]}%`, `%${searchResult.keywords[params.length / 3]}%`, `%${searchResult.keywords[params.length / 3]}%`);
      paramIndex += 3;
      return condition;
    });
    conditions.push(`(${keywordConditions.join(' OR ')})`);
  }
  
  return { conditions, params };
}