// Service for fetching authentic town and location images
export interface LocationImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

export class ImageService {
  private unsplashAccessKey: string;

  constructor() {
    this.unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'nDBXNEcDRPBw6fqYhcr5Xd-SgdiNZHwcZcKYJdPqe0U';
  }

  async getLocationImage(searchTerm: string): Promise<LocationImage | null> {
    if (!this.unsplashAccessKey) {
      console.warn('Unsplash API key not provided, key:', this.unsplashAccessKey);
      return null;
    }

    console.log('Fetching image for:', searchTerm);
    
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${this.unsplashAccessKey}`
          }
        }
      );

      console.log('Unsplash response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Unsplash API error:', response.status, errorText);
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Unsplash data:', data);
      
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        console.log('Found photo:', photo.urls.regular);
        return {
          url: photo.urls.regular,
          alt: photo.alt_description || searchTerm,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html
        };
      }

      console.log('No photos found for search term');
      return null;
    } catch (error) {
      console.error('Error fetching location image:', error);
      return null;
    }
  }

  // Fallback to a default image when no API key is available
  getDefaultLocationImage(townName: string): LocationImage {
    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="400" height="240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)"/>
          <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">${townName}</text>
        </svg>
      `)}`,
      alt: `${townName} area`,
      photographer: '',
      photographerUrl: ''
    };
  }
}

export const imageService = new ImageService();