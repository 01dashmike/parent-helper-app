export interface PostcodeData {
  postcode: string;
  latitude: number;
  longitude: number;
  district: string;
  region: string;
  country: string;
}

import { ukPostcodesAPI } from './postcodes-api';

export async function validateAndLookupPostcode(postcode: string): Promise<PostcodeData> {
  if (!ukPostcodesAPI.isValidPostcodeFormat(postcode)) {
    throw new Error('Invalid postcode format');
  }

  // Use the UK Government's free postcodes API
  const result = await ukPostcodesAPI.lookupPostcode(postcode);
  
  if (!result) {
    throw new Error('Postcode not found');
  }

  return {
    postcode: result.postcode,
    latitude: result.latitude,
    longitude: result.longitude,
    district: result.admin_district,
    region: result.region,
    country: result.country
  };
}

export function validatePostcodeFormat(postcode: string): boolean {
  return ukPostcodesAPI.isValidPostcodeFormat(postcode);
}

export function formatPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  }
  return cleaned;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
