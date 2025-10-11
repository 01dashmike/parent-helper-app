import { supabase, Class, ApiResponse } from './supabase.js';

export interface ClassFilters {
  town?: string;
  category?: string;
  age_group_min?: number;
  age_group_max?: number;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export class ClassesService {
  /**
   * Get all classes with optional filtering
   */
  static async getClasses(filters: ClassFilters = {}): Promise<ApiResponse<Class[]>> {
    try {
      let query = supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Only filter on fields that exist in the classes table
      if (filters.town) {
        query = query.eq('town', filters.town);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.age_group_min !== undefined) {
        query = query.gte('age_group_min', filters.age_group_min);
      }
      if (filters.age_group_max !== undefined) {
        query = query.lte('age_group_max', filters.age_group_max);
      }
      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error.message, error.details, error.hint);
        return {
          success: false,
          error: 'Failed to fetch classes from database'
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('Classes service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get featured classes
   */
  static async getFeaturedClasses(limit: number = 10): Promise<ApiResponse<Class[]>> {
    return this.getClasses({ is_featured: true, limit });
  }

  /**
   * Get classes by town
   */
  static async getClassesByTown(town: string, limit: number = 50): Promise<ApiResponse<Class[]>> {
    return this.getClasses({ town, limit });
  }

  /**
   * Get classes by category
   */
  static async getClassesByCategory(category: string, limit: number = 50): Promise<ApiResponse<Class[]>> {
    return this.getClasses({ category, limit });
  }

  /**
   * Get a single class by ID
   */
  static async getClassById(id: number): Promise<ApiResponse<Class | null>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Class not found'
          };
        }
        console.error('Supabase error:', error);
        return {
          success: false,
          error: 'Failed to fetch class from database'
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Class service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Search classes by name or description
   */
  static async searchClasses(searchTerm: string, limit: number = 20): Promise<ApiResponse<Class[]>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Supabase search error:', error);
        return {
          success: false,
          error: 'Failed to search classes'
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('Search service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get available categories
   */
  static async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) {
        console.error('Supabase categories error:', error);
        return {
          success: false,
          error: 'Failed to fetch categories'
        };
      }

      const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
      
      return {
        success: true,
        data: categories
      };

    } catch (error) {
      console.error('Categories service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get available towns
   */
  static async getTowns(search?: string, limit: number = 25): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('town')
        .eq('is_active', true)
        .not('town', 'is', null)
        .limit(limit);

      if (error) {
        console.error('Supabase towns error:', error);
        return {
          success: false,
          error: 'Failed to fetch towns'
        };
      }

      let towns = [...new Set(data?.map(item => item.town).filter(Boolean))];

      if (search) {
        const normalizedSearch = search.toLowerCase();
        towns = towns
          .filter((town) => town?.toLowerCase().includes(normalizedSearch))
          .slice(0, limit);
      }

      return {
        success: true,
        data: towns
      };

    } catch (error) {
      console.error('Towns service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
} 
