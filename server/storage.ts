import { 
  classes, 
  newsletters, 
  blogPosts,
  type Class, 
  type InsertClass,
  type Newsletter,
  type InsertNewsletter,
  type BlogPost,
  type InsertBlogPost,
  type SearchParams
} from "@shared/schema";

export interface IStorage {
  // Classes
  getClass(id: number): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  searchClasses(params: SearchParams): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  getFeaturedClasses(): Promise<Class[]>;
  getClassesByCategory(category: string): Promise<Class[]>;
  
  // Newsletter
  subscribeNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  unsubscribeNewsletter(email: string): Promise<boolean>;
  getNewsletterSubscribers(): Promise<Newsletter[]>;
  getSubscribersByPostcode(postcode: string): Promise<Newsletter[]>;
  
  // Blog
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private classes: Map<number, Class>;
  private newsletters: Map<number, Newsletter>;
  private blogPosts: Map<number, BlogPost>;
  private currentClassId: number;
  private currentNewsletterId: number;
  private currentBlogPostId: number;

  constructor() {
    this.classes = new Map();
    this.newsletters = new Map();
    this.blogPosts = new Map();
    this.currentClassId = 1;
    this.currentNewsletterId = 1;
    this.currentBlogPostId = 1;
    
    // Initialize with some sample data for development
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample classes
    const sampleClasses: InsertClass[] = [
      {
        name: "Little Sensory Explorers",
        description: "Sensory play classes for babies 0-12 months. Discover textures, sounds, and colors in a safe, nurturing environment.",
        ageGroupMin: 0,
        ageGroupMax: 12,
        price: null,
        isFeatured: true,
        venue: "Camden Community Centre",
        address: "123 Camden High Street",
        postcode: "NW1 7JN",
        latitude: "51.5431",
        longitude: "-0.1503",
        dayOfWeek: "Monday",
        time: "10:30am",
        contactEmail: "info@sensoryexplorers.co.uk",
        contactPhone: "020 7123 4567",
        website: "https://sensoryexplorers.co.uk",
        category: "sensory",
        rating: "4.9",
        reviewCount: 127,
        popularity: 95,
        isActive: true,
      },
      {
        name: "Tiny Tunes Music",
        description: "Interactive music sessions with singing, dancing, and instrument play for toddlers and their grown-ups.",
        ageGroupMin: 12,
        ageGroupMax: 36,
        price: "12.00",
        isFeatured: false,
        venue: "St. Mary's Church Hall",
        address: "456 Gospel Oak Road",
        postcode: "NW5 2AB",
        latitude: "51.5456",
        longitude: "-0.1489",
        dayOfWeek: "Tuesday",
        time: "11:00am",
        contactEmail: "hello@tinytunes.co.uk",
        contactPhone: "020 7234 5678",
        website: "https://tinytunes.co.uk",
        category: "music",
        rating: "4.8",
        reviewCount: 89,
        popularity: 87,
        isActive: true,
      },
      {
        name: "Splash Babies",
        description: "Gentle water introduction classes in warm, baby-friendly pools with qualified instructors.",
        ageGroupMin: 6,
        ageGroupMax: 24,
        price: "18.00",
        isFeatured: false,
        venue: "Camden Sports Centre",
        address: "789 Camden Road",
        postcode: "NW1 9ED",
        latitude: "51.5489",
        longitude: "-0.1534",
        dayOfWeek: "Saturday",
        time: "9:30am",
        contactEmail: "swim@splashbabies.co.uk",
        contactPhone: "020 7345 6789",
        website: "https://splashbabies.co.uk",
        category: "swimming",
        rating: "4.7",
        reviewCount: 156,
        popularity: 92,
        isActive: true,
      },
      {
        name: "Little Yogis",
        description: "Gentle yoga and movement sessions for toddlers and parents to practice mindfulness together.",
        ageGroupMin: 18,
        ageGroupMax: 48,
        price: null,
        isFeatured: false,
        venue: "Harmony Wellness Studio",
        address: "321 Primrose Hill Road",
        postcode: "NW1 8JR",
        latitude: "51.5398",
        longitude: "-0.1456",
        dayOfWeek: "Thursday",
        time: "10:00am",
        contactEmail: "namaste@littleyogis.co.uk",
        contactPhone: "020 7456 7890",
        website: "https://littleyogis.co.uk",
        category: "yoga",
        rating: "4.6",
        reviewCount: 73,
        popularity: 78,
        isActive: true,
      }
    ];

    sampleClasses.forEach(classData => {
      this.createClass(classData);
    });

    // Sample blog posts
    const samplePosts: InsertBlogPost[] = [
      {
        title: "10 Essential Developmental Milestones for 12-18 Month Olds",
        slug: "developmental-milestones-12-18-months",
        excerpt: "Understanding what to expect during this crucial period of rapid development and how classes can support growth...",
        content: "Full blog content here...",
        imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3",
        readTimeMinutes: 5,
        isPublished: true,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        title: "The Benefits of Early Swimming Lessons for Babies",
        slug: "benefits-early-swimming-lessons-babies",
        excerpt: "Discover how baby swimming classes boost confidence, coordination, and create lasting bonds between parent and child...",
        content: "Full blog content here...",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3",
        readTimeMinutes: 7,
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      {
        title: "How Music Classes Enhance Language Development",
        slug: "music-classes-enhance-language-development",
        excerpt: "Research shows that early musical experiences significantly impact speech and language development in young children...",
        content: "Full blog content here...",
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3",
        readTimeMinutes: 6,
        isPublished: true,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      }
    ];

    samplePosts.forEach(post => {
      this.createBlogPost(post);
    });
  }

  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.isActive);
  }

  async searchClasses(params: SearchParams): Promise<Class[]> {
    let results = Array.from(this.classes.values()).filter(c => 
      params.includeInactive || c.isActive
    );

    // Filter by category if specified
    if (params.category && params.category !== 'all') {
      results = results.filter(c => c.category === params.category);
    }

    // Filter by age group if specified
    if (params.ageGroup && params.ageGroup !== 'all') {
      const ageRanges: Record<string, [number, number]> = {
        '0-6': [0, 6],
        '6-12': [6, 12],
        '1-2': [12, 24],
        '2-3': [24, 36],
        '3-5': [36, 60]
      };
      
      const [minAge, maxAge] = ageRanges[params.ageGroup] || [0, 999];
      results = results.filter(c => 
        c.ageGroupMin <= maxAge && c.ageGroupMax >= minAge
      );
    }

    // Sort by featured first, then by popularity
    results.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }
      return b.popularity - a.popularity;
    });

    return results;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.currentClassId++;
    const newClass: Class = {
      ...classData,
      id,
      createdAt: new Date(),
    };
    this.classes.set(id, newClass);
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const existingClass = this.classes.get(id);
    if (!existingClass) return undefined;

    const updatedClass: Class = { ...existingClass, ...classData };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }

  async getFeaturedClasses(): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.isFeatured && c.isActive);
  }

  async getClassesByCategory(category: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => 
      c.category === category && c.isActive
    );
  }

  // Newsletter methods
  async subscribeNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const id = this.currentNewsletterId++;
    const newSubscription: Newsletter = {
      ...newsletter,
      id,
      subscribedAt: new Date(),
    };
    this.newsletters.set(id, newSubscription);
    return newSubscription;
  }

  async unsubscribeNewsletter(email: string): Promise<boolean> {
    for (const [id, newsletter] of this.newsletters) {
      if (newsletter.email === email) {
        newsletter.isActive = false;
        return true;
      }
    }
    return false;
  }

  async getNewsletterSubscribers(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values()).filter(n => n.isActive);
  }

  async getSubscribersByPostcode(postcode: string): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values()).filter(n => 
      n.isActive && n.postcode === postcode
    );
  }

  // Blog methods
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(p => p.slug === slug);
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values());
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(p => p.isPublished)
      .sort((a, b) => {
        const aDate = a.publishedAt || a.createdAt;
        const bDate = b.publishedAt || b.createdAt;
        return bDate.getTime() - aDate.getTime();
      });
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const newPost: BlogPost = {
      ...post,
      id,
      createdAt: new Date(),
    };
    this.blogPosts.set(id, newPost);
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return undefined;

    const updatedPost: BlogPost = { ...existingPost, ...post };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }
}

export const storage = new MemStorage();
