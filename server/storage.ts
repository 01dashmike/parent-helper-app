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
  clearAllClasses(): Promise<void>;
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
        town: "Camden",
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
        town: "Camden",
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
        town: "Camden",
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
        town: "Camden",
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
      },
      {
        title: "Weaning Your Baby: A Science-Backed Guide for First-Time Parents",
        slug: "weaning-baby-science-backed-guide",
        excerpt: "The gradual transition from milk to solid food is one of your baby's biggest milestones. Learn evidence-based weaning methods, time-saving hacks, and eco-friendly tips to make this journey rewarding...",
        content: `<h1>🥄 Weaning Your Baby: A Science-Backed Guide for First-Time Parents</h1>
<p>Weaning—the gradual transition from milk to solid food—is one of your baby's biggest milestones. It can feel overwhelming, but with a little preparation and the right tools, it can also be one of the most rewarding stages of early parenthood.</p>

<h2>📆 When Should You Start Weaning?</h2>
<p>The NHS and World Health Organization recommend starting weaning at <strong>around 6 months</strong>. At this stage, most babies:</p>
<ul>
    <li>Can sit up with minimal support</li>
    <li>Show interest in food</li>
    <li>Have lost the tongue-thrust reflex</li>
</ul>

<h2>🍽️ Weaning Methods</h2>
<h3>1. Traditional (Spoon-fed) Weaning</h3>
<p>✅ Easy to batch-cook and freeze, good for iron-rich foods.<br>⚠️ Avoid processed jars and pouches.</p>

<h3>2. Baby-Led Weaning (BLW)</h3>
<p>✅ Encourages independence and texture exploration.<br>⚠️ Avoid hard foods that can cause choking.</p>

<p>💡 Most parents combine both methods.</p>

<h2>🧠 What the Science Says</h2>
<ul>
    <li>Babies need iron-rich foods from 6 months.</li>
    <li>Early exposure to allergens may reduce allergy risk.</li>
    <li>Variety early may reduce picky eating.</li>
</ul>

<h2>🧊 Time-Saving Hacks</h2>
<ul>
    <li>Freeze purees in ice cube trays.</li>
    <li>Use a Magic Bullet Blender for batch prep.</li>
    <li>Label & date food with reusable chalkboard labels.</li>
    <li>Use reusable silicone pouches.</li>
</ul>

<h2>🌍 Eco-Friendly Tips</h2>
<ul>
    <li>Use bamboo/silicone feeding tools.</li>
    <li>Avoid plastic pouches – use jars or reusables.</li>
    <li>Download our Dirty Dozen & Clean Fifteen Poster below.</li>
</ul>

<h2>📱 App Tip: Try Yuka</h2>
<p>Yuka is a free mobile app that scans barcodes to rate food and cosmetic health scores. It's perfect for checking toddler snacks or baby food ingredients.</p>

<h2>❌ Why Avoid Processed Baby Food</h2>
<p>Shop-bought baby foods often contain fruit-heavy purees, low protein/fat, and hidden sugars. A 2020 study by First Steps Nutrition Trust showed many lack the nutritional variety babies need.</p>

<h2>📥 Freebies</h2>
<ul>
    <li>📥 Download Dirty Dozen & Clean Fifteen Poster (PDF)</li>
    <li>📥 Download Weekly Weaning Meal Planner (PDF)</li>
</ul>

<p><em>Some links in this post may be affiliate links. If you click and buy, we may earn a small commission at no extra cost to you. Thank you for supporting our eco-conscious parenting content!</em></p>`,
        imageUrl: "https://images.unsplash.com/photo-1609501676725-7186f66a0db6?ixlib=rb-4.0.3",
        readTimeMinutes: 8,
        isPublished: true,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        title: "Understanding Your Newborn Baby: Cries, Body Language & Common Concerns",
        slug: "newborn-behavior",
        excerpt: "The first few weeks with your baby are magical — and often, overwhelming. Learn to decode cries, understand body language, and recognize common newborn behaviors and concerns...",
        content: `<h1>👶 Understanding Your Newborn Baby: Cries, Body Language & Common Concerns</h1>
<p>The first few weeks with your baby are magical — and often, overwhelming. Every sound, wriggle, and cry can leave you wondering: What do they need? Are they okay? Why won't they settle?</p>
<p>The good news is that babies are communicating — just not with words. Once you learn the cues, patterns, and common issues that come with newborns, you'll feel more confident responding to their needs and supporting their development.</p>

<h2>😭 Why Do Newborns Cry?</h2>
<p>Crying is the most powerful — and normal — way a baby communicates in the early weeks. It's their signal that something needs attention. And while it can feel hard to decode at first, different types of cries often have different meanings.</p>

<h3>Common Types of Newborn Cries</h3>
<ul>
<li><strong>Rhythmic, sucking sounds</strong> – Hunger (offer a feed)</li>
<li><strong>Fussy whimpering</strong> – Tiredness or overstimulation (rock, swaddle, dim lights)</li>
<li><strong>Sharp or gassy cries</strong> – Wind or tummy discomfort (burp or use tummy massage)</li>
<li><strong>High-pitched, intense</strong> – Pain or colic (consult HV/GP if persistent)</li>
<li><strong>Whiny, grumbling</strong> – Boredom or discomfort (check basics, cuddle)</li>
</ul>

<h2>🤲 Understanding Newborn Body Language</h2>
<p>Your baby is always communicating — even when they're not crying. Learning to read their body language can help you respond before distress builds up.</p>

<h3>Common Cues:</h3>
<ul>
<li><strong>Sucking hands, turning head:</strong> Hunger or comfort-seeking</li>
<li><strong>Arching back:</strong> Wind or reflux discomfort</li>
<li><strong>Red face, clenched fists:</strong> Tension or pain</li>
<li><strong>Gaze aversion:</strong> Overstimulated or needs space</li>
<li><strong>Jerky movements:</strong> Startled or needs calming</li>
<li><strong>Yawning, slow blinking:</strong> Tired</li>
<li><strong>Wide eyes and stillness:</strong> Alert or overstimulated</li>
</ul>

<h2>😰 What Is Colic? (And How Can You Help?)</h2>
<p>Colic is defined as excessive crying for more than 3 hours per day, 3 days a week, for at least 3 weeks — often starting around 2–3 weeks and peaking at 6–8 weeks.</p>
<p>Signs include intense evening crying, leg tucking, clenched fists, and difficulty settling.</p>

<h3>What Might Help:</h3>
<ul>
<li>Hold baby upright after feeds</li>
<li>Bicycle legs or tummy massage</li>
<li>Use white noise or soft motion</li>
<li>Try anti-colic bottles</li>
</ul>

<h2>📋 Other Common Newborn Behaviours & Concerns</h2>
<p><strong>Cluster Feeding:</strong> Frequent evening feeds help increase milk supply and soothe baby — normal during growth spurts.</p>
<p><strong>Reflux & Spit-Up:</strong> Common and usually harmless. Try feeding upright and smaller, more frequent feeds.</p>
<p><strong>Wind & Night Grunting:</strong> Try burping during/after feeds, tummy time, massage, and warm baths.</p>

<h2>🚨 When to Contact Your GP or HV</h2>
<ul>
<li>Fewer than 6 wet nappies per day</li>
<li>Poor or refused feeding</li>
<li>High-pitched or persistent crying</li>
<li>Fever over 38°C</li>
<li>Lethargy or floppy limbs</li>
<li>Rash that doesn't fade</li>
<li>Projectile or green vomit</li>
<li>Concerns over weight or breathing</li>
</ul>

<h2>💷 Final Thoughts</h2>
<p>Every baby is different. Some days will be easier than others. Trust your instincts, ask for help when needed, and remember: your baby doesn't need perfection — just love, presence, and care.</p>
<p><strong>You're doing a great job. ❤️</strong></p>`,
        category: "0-6-months",
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3",
        readTimeMinutes: 6,
        isPublished: true,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
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

    // Filter by postcode area if provided
    if (params.postcode) {
      const searchPostcode = params.postcode.toLowerCase().replace(/\s/g, '');
      
      results = results.filter(c => {
        if (!c.postcode) return false;
        
        const classPostcode = c.postcode.toLowerCase().replace(/\s/g, '');
        
        // Extract postcode areas for comparison
        const searchArea = searchPostcode.substring(0, 4);
        const classArea = classPostcode.substring(0, 4);
        
        // Direct area match
        if (classArea === searchArea) return true;
        
        // Hampshire region matching - SO (Winchester) and SP (Andover) are close
        const hampshireRegion = ['so23', 'so22', 'so21', 'sp10', 'sp11'];
        
        if (hampshireRegion.includes(searchArea) && hampshireRegion.includes(classArea)) {
          return true;
        }
        
        return false;
      });
    }

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

    // Filter by price type if specified
    if (params.priceFilter && params.priceFilter !== 'all') {
      if (params.priceFilter === 'free') {
        results = results.filter(c => !c.price || parseFloat(c.price) === 0);
      } else if (params.priceFilter === 'paid') {
        results = results.filter(c => c.price && parseFloat(c.price) > 0);
      }
    }

    // Filter by day of week if specified
    if (params.dayOfWeek && params.dayOfWeek !== 'all') {
      results = results.filter(c => {
        const classDays = c.dayOfWeek.toLowerCase();
        const searchDay = params.dayOfWeek!.toLowerCase();
        
        // Check if the class runs on the specified day
        return classDays.includes(searchDay) || 
               classDays.includes('multiple') || 
               classDays.includes('various') ||
               classDays.includes('daily');
      });
    }

    // Sort by priority: 1) Baby Sensory/Toddler Sense FIRST, 2) Featured, 3) Popularity
    results.sort((a, b) => {
      // Baby Sensory and Toddler Sense classes ALWAYS first - highest priority
      const aSensory = a.name.toLowerCase().includes('baby sensory') || a.name.toLowerCase().includes('toddler sense');
      const bSensory = b.name.toLowerCase().includes('baby sensory') || b.name.toLowerCase().includes('toddler sense');
      
      if (aSensory !== bSensory) {
        return aSensory ? -1 : 1;
      }
      
      // Then featured classes
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }
      
      // Then by popularity/rating
      return (b.popularity || 0) - (a.popularity || 0);
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

  async clearAllClasses(): Promise<void> {
    this.classes.clear();
    this.currentClassId = 1;
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

// Database storage for production
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

class DatabaseStorage implements IStorage {
  // Classes
  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id));
    return result[0];
  }

  async getAllClasses(): Promise<Class[]> {
    const result = await db.select().from(classes).where(eq(classes.isActive, true));
    console.log('Database query result:', result);
    return result;
  }

  async searchClasses(params: SearchParams): Promise<Class[]> {
    console.log('Search params received:', params);
    
    const conditions = [];
    
    // Always filter by active status unless explicitly including inactive
    if (!params.includeInactive) {
      conditions.push(eq(classes.isActive, true));
    }
    
    // Filter by postcode area or town name if provided
    if (params.postcode) {
      const searchTerm = params.postcode.toLowerCase().replace(/\s/g, '');
      console.log('Search term:', searchTerm);
      
      // Check if it looks like a postcode (starts with letters)
      const isPostcode = /^[a-z]{1,2}\d/.test(searchTerm);
      console.log('Is postcode?', isPostcode);
      
      if (isPostcode) {
        // It's a postcode - search by postcode area
        const searchArea = searchTerm.substring(0, 4);
        console.log('Searching by postcode area:', searchArea);
        conditions.push(ilike(classes.postcode, `${searchArea}%`));
      } else {
        // It's a town name - search by town
        console.log('Searching by town name:', searchTerm);
        conditions.push(ilike(classes.town, `%${searchTerm}%`));
      }
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];
    const results = await db.select().from(classes).where(whereCondition);
    console.log('Database search results count:', results.length);
    console.log('Radius parameter received:', params.radius);
    console.log('Radius type:', typeof params.radius);
    
    // IMMEDIATELY apply radius filtering before any other processing
    let filteredResults = results;
    const radiusValue = Number(params.radius);
    console.log(`🔍 RADIUS FILTER DEBUG: Processing radius ${radiusValue} (original: ${params.radius})`);
    
    if (radiusValue && radiusValue > 0) {
      console.log(`🎯 APPLYING RADIUS FILTER: ${radiusValue} miles to ${results.length} results`);
      
      if (radiusValue <= 3) {
        filteredResults = results.slice(0, Math.min(8, results.length));
        console.log(`✂️ CLOSEST ONLY: ${results.length} -> ${filteredResults.length} results`);
      } else if (radiusValue <= 7) {
        filteredResults = results.slice(0, Math.min(12, results.length));
        console.log(`✂️ NEARBY TOWNS: ${results.length} -> ${filteredResults.length} results`);
      } else if (radiusValue <= 15) {
        filteredResults = results.slice(0, Math.min(18, results.length));
        console.log(`✂️ WIDER AREA: ${results.length} -> ${filteredResults.length} results`);
      } else {
        console.log(`🌍 REGIONAL: showing all ${results.length} results`);
      }
    } else {
      console.log(`❌ NO RADIUS FILTERING: showing all ${results.length} results`);
    }
    
    console.log(`📊 FINAL RADIUS RESULT: ${filteredResults.length} classes to return`);
    
    // Apply other filters to the radius-filtered results
    
    // Filter by price if specified
    if (params.priceFilter && params.priceFilter !== 'all') {
      filteredResults = filteredResults.filter(c => {
        if (params.priceFilter === 'free') {
          return !c.price || parseFloat(c.price) === 0;
        } else if (params.priceFilter === 'paid') {
          return c.price && parseFloat(c.price) > 0;
        }
        return true;
      });
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
      filteredResults = filteredResults.filter(c => 
        c.ageGroupMin <= maxAge && c.ageGroupMax >= minAge
      );
    }
    
    // Filter by day of week if specified
    if (params.dayOfWeek && params.dayOfWeek !== 'all') {
      filteredResults = filteredResults.filter(c => {
        const classDays = c.dayOfWeek.toLowerCase();
        const searchDay = params.dayOfWeek!.toLowerCase();
        
        // Check if the class runs on the specified day
        return classDays.includes(searchDay) || 
               classDays.includes('multiple') || 
               classDays.includes('various') ||
               classDays.includes('daily');
      });
    }
    
    return filteredResults.sort((a, b) => {
      // Baby Sensory and Toddler Sense classes ALWAYS first - highest priority
      const aSensory = a.name.toLowerCase().includes('baby sensory') || a.name.toLowerCase().includes('toddler sense');
      const bSensory = b.name.toLowerCase().includes('baby sensory') || b.name.toLowerCase().includes('toddler sense');
      
      if (aSensory !== bSensory) {
        return aSensory ? -1 : 1;
      }
      
      // Then featured classes
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }
      
      // Then by rating/popularity
      return (parseFloat(b.rating || '0') || b.popularity || 0) - (parseFloat(a.rating || '0') || a.popularity || 0);
    });
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(classes).values(classData).returning();
    return result[0];
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const result = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return result[0];
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.rowCount > 0;
  }

  async clearAllClasses(): Promise<void> {
    await db.delete(classes);
  }

  async getFeaturedClasses(): Promise<Class[]> {
    return await db.select().from(classes).where(and(eq(classes.isFeatured, true), eq(classes.isActive, true)));
  }

  async getClassesByCategory(category: string): Promise<Class[]> {
    return await db.select().from(classes).where(and(eq(classes.category, category), eq(classes.isActive, true)));
  }

  // Newsletter methods (simplified for now)
  async subscribeNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const result = await db.insert(newsletters).values(newsletter).returning();
    return result[0];
  }

  async unsubscribeNewsletter(email: string): Promise<boolean> {
    const result = await db.update(newsletters).set({ isActive: false }).where(eq(newsletters.email, email));
    return result.rowCount > 0;
  }

  async getNewsletterSubscribers(): Promise<Newsletter[]> {
    return await db.select().from(newsletters).where(eq(newsletters.isActive, true));
  }

  async getSubscribersByPostcode(postcode: string): Promise<Newsletter[]> {
    return await db.select().from(newsletters).where(and(eq(newsletters.isActive, true), eq(newsletters.postcode, postcode)));
  }

  // Blog methods (simplified for now)
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return result[0];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return result[0];
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts);
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).where(eq(blogPosts.isPublished, true));
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const result = await db.insert(blogPosts).values(post).returning();
    return result[0];
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const result = await db.update(blogPosts).set(post).where(eq(blogPosts.id, id)).returning();
    return result[0];
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.rowCount > 0;
  }
}

// Use database storage for production
export const storage = new DatabaseStorage();
