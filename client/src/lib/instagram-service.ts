export interface InstagramPhoto {
  id: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  caption?: string;
  timestamp: string;
  permalink: string;
}

export interface InstagramProfile {
  id: string;
  username: string;
  media_count: number;
  followers_count: number;
}

export class InstagramService {
  private accessToken: string;
  private baseUrl = 'https://graph.instagram.com';

  constructor() {
    // We'll need Instagram Basic Display API access token
    this.accessToken = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN || '';
  }

  async getBusinessProfile(instagramHandle: string): Promise<InstagramProfile | null> {
    if (!this.accessToken) {
      console.warn('Instagram access token not configured');
      return null;
    }

    try {
      // Search for business account by username
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,username,media_count,followers_count&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Instagram profile fetch error:', error);
      return null;
    }
  }

  async getRecentPhotos(instagramHandle: string, limit: number = 6): Promise<InstagramPhoto[]> {
    if (!this.accessToken) {
      console.warn('Instagram access token not configured');
      return [];
    }

    try {
      // Get recent media from the business account
      const response = await fetch(
        `${this.baseUrl}/me/media?fields=id,media_url,media_type,caption,timestamp,permalink&limit=${limit}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Instagram photos fetch error:', error);
      return [];
    }
  }

  async getClassPhotos(instagramHandle: string): Promise<InstagramPhoto[]> {
    const photos = await this.getRecentPhotos(instagramHandle, 12);
    
    // Filter for class-related content (look for baby/toddler related keywords)
    const classKeywords = ['baby', 'toddler', 'class', 'sensory', 'music', 'swimming', 'yoga', 'play'];
    
    return photos.filter(photo => {
      if (!photo.caption) return true; // Include photos without captions
      
      const caption = photo.caption.toLowerCase();
      return classKeywords.some(keyword => caption.includes(keyword));
    });
  }
}

export const instagramService = new InstagramService();