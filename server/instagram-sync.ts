import { storage } from "./storage";

export interface InstagramCredentials {
  accessToken: string;
  appId: string;
  appSecret: string;
}

export class InstagramSyncService {
  constructor(credentials: InstagramCredentials) {
    // No longer storing credentials
  }

  async syncAllClassPhotos(): Promise<void> {
    console.log('Starting Instagram photo sync for all classes...');
    
    const classes = await storage.getAllClasses();
    const classesWithInstagram = classes.filter(c => c.instagramHandle);
    
    console.log(`Found ${classesWithInstagram.length} classes with Instagram handles`);
    
    for (const classItem of classesWithInstagram) {
      try {
        await this.syncClassPhotos(classItem.instagramHandle!, classItem.id);
        // Add delay to respect Instagram API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to sync photos for ${classItem.instagramHandle}:`, error);
      }
    }
    
    console.log('Instagram photo sync completed');
  }

  private async syncClassPhotos(instagramHandle: string, classId: number): Promise<void> {
    // This would fetch photos from Instagram API and store references
    // For now, we'll prepare the structure
    console.log(`Syncing photos for @${instagramHandle} (class ${classId})`);
  }

  async detectInstagramHandles(): Promise<void> {
    // Scan class descriptions and websites to auto-detect Instagram handles
    const classes = await storage.getAllClasses();
    
    for (const classItem of classes) {
      const instagramHandle = this.extractInstagramHandle(
        classItem.description + ' ' + (classItem.website || '')
      );
      
      if (instagramHandle && !classItem.instagramHandle) {
        await storage.updateClass(classItem.id, { 
          instagramHandle 
        });
        console.log(`Detected Instagram handle @${instagramHandle} for ${classItem.name}`);
      }
    }
  }

  private extractInstagramHandle(text: string): string | null {
    // Look for Instagram handles in text
    const patterns = [
      /@([a-zA-Z0-9_.]+)/g,
      /instagram\.com\/([a-zA-Z0-9_.]+)/g,
      /ig: ?@?([a-zA-Z0-9_.]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[0].replace(/[@\/ig:\s]/gi, '').toLowerCase();
      }
    }

    return null;
  }
}

// Initialize service when credentials are available
export function createInstagramSync(): InstagramSyncService | null {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!accessToken || !appId || !appSecret) {
    console.warn('Instagram credentials not configured');
    return null;
  }

  return new InstagramSyncService({
    accessToken,
    appId,
    appSecret
  });
}