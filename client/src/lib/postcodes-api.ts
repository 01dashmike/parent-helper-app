export interface PostcodeApiResult {
  postcode: string;
  latitude: number;
  longitude: number;
  district: string;
  admin_district: string;
  admin_county: string;
  admin_ward: string;
  parish: string;
  parliamentary_constituency: string;
  region: string;
  country: string;
  european_electoral_region: string;
  primary_care_trust: string;
  msoa: string;
  lsoa: string;
  nuts: string;
  incode: string;
  outcode: string;
}

export interface PostcodeApiResponse {
  status: number;
  result: PostcodeApiResult | null;
}

export interface BulkPostcodeResponse {
  status: number;
  result: Array<{
    query: string;
    result: PostcodeApiResult | null;
  }>;
}

export interface NearestPostcodeResponse {
  status: number;
  result: PostcodeApiResult[];
}

export class UKPostcodesAPI {
  private baseUrl = 'https://api.postcodes.io';

  /**
   * Lookup a single postcode
   */
  async lookupPostcode(postcode: string): Promise<PostcodeApiResult | null> {
    try {
      const cleanPostcode = this.cleanPostcode(postcode);
      const response = await fetch(`${this.baseUrl}/postcodes/${cleanPostcode}`);
      
      if (!response.ok) {
        return null;
      }

      const data: PostcodeApiResponse = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error looking up postcode:', error);
      return null;
    }
  }

  /**
   * Bulk lookup multiple postcodes
   */
  async bulkLookupPostcodes(postcodes: string[]): Promise<Array<{ postcode: string; result: PostcodeApiResult | null }>> {
    try {
      const cleanPostcodes = postcodes.map(p => this.cleanPostcode(p));
      
      const response = await fetch(`${this.baseUrl}/postcodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postcodes: cleanPostcodes }),
      });

      if (!response.ok) {
        return postcodes.map(p => ({ postcode: p, result: null }));
      }

      const data: BulkPostcodeResponse = await response.json();
      return data.result.map(item => ({
        postcode: item.query,
        result: item.result,
      }));
    } catch (error) {
      console.error('Error bulk looking up postcodes:', error);
      return postcodes.map(p => ({ postcode: p, result: null }));
    }
  }

  /**
   * Find nearest postcodes to coordinates
   */
  async findNearestPostcodes(latitude: number, longitude: number, limit: number = 10): Promise<PostcodeApiResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/postcodes?lon=${longitude}&lat=${latitude}&limit=${limit}`
      );

      if (!response.ok) {
        return [];
      }

      const data: NearestPostcodeResponse = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Error finding nearest postcodes:', error);
      return [];
    }
  }

  /**
   * Validate postcode format using the API
   */
  async validatePostcode(postcode: string): Promise<boolean> {
    const result = await this.lookupPostcode(postcode);
    return result !== null;
  }

  /**
   * Get precise coordinates for a postcode
   */
  async getPostcodeCoordinates(postcode: string): Promise<{ latitude: number; longitude: number } | null> {
    const result = await this.lookupPostcode(postcode);
    if (!result) return null;

    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  }

  /**
   * Get administrative information for a postcode
   */
  async getPostcodeAdmin(postcode: string): Promise<{
    district: string;
    county: string;
    region: string;
    country: string;
  } | null> {
    const result = await this.lookupPostcode(postcode);
    if (!result) return null;

    return {
      district: result.admin_district,
      county: result.admin_county,
      region: result.region,
      country: result.country,
    };
  }

  /**
   * Clean and format postcode for API usage
   */
  private cleanPostcode(postcode: string): string {
    return postcode.replace(/\s+/g, '').toUpperCase();
  }

  /**
   * Enhanced postcode format validation
   */
  isValidPostcodeFormat(postcode: string): boolean {
    const cleanPostcode = this.cleanPostcode(postcode);
    // UK postcode regex pattern
    const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/;
    return postcodeRegex.test(cleanPostcode);
  }
}

export const ukPostcodesAPI = new UKPostcodesAPI();