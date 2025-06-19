// Major UK towns and cities with population over 15,000
// This will be the source of truth for location display
export interface MajorTown {
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
  population: number;
  county: string;
  region: string;
}

export const majorTowns: MajorTown[] = [
  // Hampshire
  { name: "Winchester", postcode: "SO23", latitude: 51.0632, longitude: -1.308, population: 45184, county: "Hampshire", region: "South East" },
  { name: "Southampton", postcode: "SO14", latitude: 50.9097, longitude: -1.4044, population: 253651, county: "Hampshire", region: "South East" },
  { name: "Portsmouth", postcode: "PO1", latitude: 50.8058, longitude: -1.0872, population: 238137, county: "Hampshire", region: "South East" },
  { name: "Basingstoke", postcode: "RG21", latitude: 51.2664, longitude: -1.0873, population: 107355, county: "Hampshire", region: "South East" },
  { name: "Andover", postcode: "SP10", latitude: 51.2085, longitude: -1.4865, population: 50887, county: "Hampshire", region: "South East" },
  { name: "Fareham", postcode: "PO14", latitude: 50.8558, longitude: -1.1865, population: 42210, county: "Hampshire", region: "South East" },
  { name: "Eastleigh", postcode: "SO50", latitude: 50.9697, longitude: -1.3480, population: 54791, county: "Hampshire", region: "South East" },
  { name: "Fleet", postcode: "GU51", latitude: 51.2905, longitude: -0.8422, population: 38726, county: "Hampshire", region: "South East" },
  { name: "Aldershot", postcode: "GU11", latitude: 51.2481, longitude: -0.7649, population: 37131, county: "Hampshire", region: "South East" },
  { name: "Farnborough", postcode: "GU14", latitude: 51.2937, longitude: -0.7567, population: 57486, county: "Hampshire", region: "South East" },
  { name: "Gosport", postcode: "PO12", latitude: 50.7958, longitude: -1.1293, population: 82622, county: "Hampshire", region: "South East" },
  { name: "Havant", postcode: "PO9", latitude: 50.8551, longitude: -0.9781, population: 45826, county: "Hampshire", region: "South East" },
  { name: "Waterlooville", postcode: "PO7", latitude: 50.8816, longitude: -1.0301, population: 64350, county: "Hampshire", region: "South East" },
  
  // Surrounding counties for broader coverage
  { name: "Reading", postcode: "RG1", latitude: 51.4543, longitude: -0.9781, population: 174224, county: "Berkshire", region: "South East" },
  { name: "Guildford", postcode: "GU1", latitude: 51.2362, longitude: -0.5704, population: 77057, county: "Surrey", region: "South East" },
  { name: "Woking", postcode: "GU21", latitude: 51.3168, longitude: -0.5586, population: 103932, county: "Surrey", region: "South East" },
  { name: "Salisbury", postcode: "SP1", latitude: 51.0693, longitude: -1.7957, population: 40302, county: "Wiltshire", region: "South West" },
  { name: "Bournemouth", postcode: "BH1", latitude: 50.7192, longitude: -1.8808, population: 183491, county: "Dorset", region: "South West" },
  { name: "Poole", postcode: "BH15", latitude: 50.7151, longitude: -1.9872, population: 151500, county: "Dorset", region: "South West" },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI/180);
}

// Find the closest major town to given coordinates
export function findClosestMajorTown(latitude: number, longitude: number): MajorTown | null {
  if (!latitude || !longitude) return null;
  
  let closestTown: MajorTown | null = null;
  let shortestDistance = Infinity;
  
  for (const town of majorTowns) {
    const distance = calculateDistance(latitude, longitude, town.latitude, town.longitude);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestTown = town;
    }
  }
  
  return closestTown;
}

// Find major town by postcode prefix
export function findTownByPostcode(postcode: string): MajorTown | null {
  const postcodePrefix = postcode.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  
  for (const town of majorTowns) {
    if (postcodePrefix.startsWith(town.postcode)) {
      return town;
    }
  }
  
  return null;
}

// Find town by name (case-insensitive partial matching)
export function findTownByName(searchTerm: string): MajorTown | null {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // First try exact match
  for (const town of majorTowns) {
    if (town.name.toLowerCase() === normalizedSearch) {
      return town;
    }
  }
  
  // Then try partial match (starts with)
  for (const town of majorTowns) {
    if (town.name.toLowerCase().startsWith(normalizedSearch)) {
      return town;
    }
  }
  
  // Finally try contains match
  for (const town of majorTowns) {
    if (town.name.toLowerCase().includes(normalizedSearch)) {
      return town;
    }
  }
  
  return null;
}

// Smart search that handles both postcodes and town names
export function findLocationByInput(input: string): MajorTown | null {
  const cleanInput = input.trim();
  
  // Check if it looks like a postcode (contains letters and numbers)
  const postcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
  const partialPostcodePattern = /^[A-Z]{1,2}[0-9]/i;
  
  if (postcodePattern.test(cleanInput) || partialPostcodePattern.test(cleanInput)) {
    return findTownByPostcode(cleanInput);
  }
  
  // Otherwise treat as town name
  return findTownByName(cleanInput);
}

// Get image search term for a town (for use with image APIs)
export function getImageSearchTerm(town: MajorTown): string {
  // Return a search term optimized for finding attractive local images
  const landmarks: Record<string, string> = {
    "Winchester": "Winchester Cathedral Hampshire England UK historic",
    "Southampton": "Southampton waterfront port city Hampshire England",
    "Portsmouth": "Portsmouth Historic Dockyard Spinnaker Tower Hampshire",
    "Basingstoke": "Basingstoke town centre shopping Hampshire England",
    "Andover": "Andover town centre market Hampshire England UK",
    "Fareham": "Fareham Hampshire England town centre high street",
    "Eastleigh": "Eastleigh Hampshire England town centre",
    "Fleet": "Fleet Hampshire England town centre pond",
    "Aldershot": "Aldershot Hampshire England military town",
    "Farnborough": "Farnborough Hampshire England aviation town",
    "Gosport": "Gosport Portsmouth harbour Hampshire England",
    "Havant": "Havant Hampshire England town centre",
    "Waterlooville": "Waterlooville Hampshire England town",
    "Reading": "Reading town centre Berkshire England Thames",
    "Guildford": "Guildford Cathedral Surrey England cobbles",
    "Woking": "Woking town centre Surrey England shopping",
    "Salisbury": "Salisbury Cathedral Wiltshire England spire",
    "Bournemouth": "Bournemouth beach pier Dorset England seaside",
    "Poole": "Poole harbour quay Dorset England boats"
  };
  
  return landmarks[town.name] || `${town.name} ${town.county} England UK town centre`;
}