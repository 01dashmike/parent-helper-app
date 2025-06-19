export interface GooglePlaceReview {
  rating: number;
  reviewCount: number;
  placeId?: string;
}

export class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
  }

  async searchPlace(businessName: string, location: string): Promise<GooglePlaceReview | null> {
    if (!this.apiKey) {
      console.warn('Google Places API key not found');
      return null;
    }

    try {
      const query = `${businessName} ${location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;

      const response = await fetch(`/api/google-places-proxy?url=${encodeURIComponent(searchUrl)}`);
      
      if (!response.ok) {
        console.error('Google Places search failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        return {
          rating: place.rating || 0,
          reviewCount: place.user_ratings_total || 0,
          placeId: place.place_id
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching Google Places data:', error);
      return null;
    }
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceReview | null> {
    if (!this.apiKey || !placeId) return null;

    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${this.apiKey}`;
      
      const response = await fetch(`/api/google-places-proxy?url=${encodeURIComponent(detailsUrl)}`);
      
      if (!response.ok) {
        console.error('Google Places details failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.result) {
        return {
          rating: data.result.rating || 0,
          reviewCount: data.result.user_ratings_total || 0,
          placeId
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }
}

export const googlePlaces = new GooglePlacesService();