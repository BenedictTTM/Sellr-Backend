import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MeiliSearchService } from '../../meilisearch/meilisearch.service';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
    radiusKm?: number;
  };
  rating?: number;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular';
}

export interface SearchResult {
  products: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  filters: {
    categories: { name: string; count: number }[];
    priceRange: { min: number; max: number };
    conditions: { name: string; count: number }[];
  };
}

@Injectable()
export class SearchProductsService {
  private readonly logger = new Logger(SearchProductsService.name);

  constructor(
    private prisma: PrismaService,
    private meilisearchService: MeiliSearchService,
  ) {}

  /**
   * Main search method using MeiliSearch with fallback to database
   */
  async searchProducts(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions,
  ): Promise<SearchResult> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    this.logger.log(`🔍 Search: "${query}" | Filters: ${JSON.stringify(filters)} | Page: ${page}`);

    try {
      // Primary: Use MeiliSearch for fast, typo-tolerant search
      return await this.searchWithMeiliSearch(query, filters || {}, options || {}, page, limit, offset);
    } catch (error) {
      // Fallback: Use database search if MeiliSearch fails
      this.logger.warn(`⚠️ MeiliSearch failed, using database: ${error.message}`);
      return await this.searchWithDatabase(query, filters || {}, options || {}, page, limit, offset);
    }
  }

  /**
   * Search using MeiliSearch (Primary method)
   */
  private async searchWithMeiliSearch(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
    page: number,
    limit: number,
    offset: number,
  ): Promise<SearchResult> {
    // Build MeiliSearch filters
    const meiliFilters: any = {
      isActive: true,
    };

    if (filters?.category) {
      meiliFilters.category = filters.category;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      meiliFilters.minPrice = filters?.minPrice;
      meiliFilters.maxPrice = filters?.maxPrice;
    }

    if (filters?.condition) {
      meiliFilters.condition = filters.condition;
    }

    // Determine sort order
    const sort = this.getSortOrder(options?.sortBy);

    // Search MeiliSearch
    const searchResults = await this.meilisearchService.searchProducts(
      query,
      meiliFilters,
      {
        limit,
        offset,
        sort,
      },
    );

    const productIds = searchResults.hits.map((hit: any) => hit.id);

    if (productIds.length === 0) {
      return this.buildEmptyResult(page, limit);
    }

    // Fetch full product details from database
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: this.getProductSelect(),
    });

    // Maintain MeiliSearch relevance order
    const orderedProducts = productIds
      .map(id => products.find(p => p.id === id))
      .filter(p => p !== undefined)
      .map(product => this.enrichProduct(product));

    // Get facets for filtering UI
    const facets = await this.getFacets(query, filters);

    const total = searchResults.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      products: orderedProducts,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      filters: facets,
    };
  }

  /**
   * Fallback search using database
   */
  private async searchWithDatabase(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
    page: number,
    limit: number,
    offset: number,
  ): Promise<SearchResult> {
    const whereClause: any = {
      AND: [
        { isActive: true },
        { isSold: false },
      ],
    };

    // Add search query
    if (query && query.trim()) {
      whereClause.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { condition: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Add filters
    if (filters?.category) {
      whereClause.AND.push({
        category: { equals: filters.category, mode: 'insensitive' },
      });
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      const priceFilter: any = {};
      if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
      whereClause.AND.push({ discountedPrice: priceFilter });
    }

    if (filters?.condition) {
      whereClause.AND.push({
        condition: { equals: filters.condition, mode: 'insensitive' },
      });
    }

    if (filters?.tags && filters.tags.length > 0) {
      whereClause.AND.push({
        tags: { hasSome: filters.tags },
      });
    }

    if (filters?.rating) {
      whereClause.AND.push({
        user: {
          rating: { gte: filters.rating },
        },
      });
    }

    // Get total count
    const total = await this.prisma.product.count({ where: whereClause });

    // Get products
    const products = await this.prisma.product.findMany({
      where: whereClause,
      select: this.getProductSelect(),
      orderBy: this.getDatabaseSortOrder(options?.sortBy),
      skip: offset,
      take: limit,
    });

    // Enrich products
    const enrichedProducts = products.map(product => this.enrichProduct(product));

    // Get facets
    const facets = await this.getFacets(query, filters);

    const totalPages = Math.ceil(total / limit);

    return {
      products: enrichedProducts,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      filters: facets,
    };
  }

  /**
   * Get available facets for filtering
   */
  private async getFacets(query: string, filters?: SearchFilters) {
    try {
      // Get categories with counts
      const categories = await this.prisma.product.groupBy({
        by: ['category'],
        where: {
          isActive: true,
          isSold: false,
        },
        _count: true,
      });

      // Get price range
      const priceRange = await this.prisma.product.aggregate({
        where: {
          isActive: true,
          isSold: false,
        },
        _min: { discountedPrice: true },
        _max: { discountedPrice: true },
      });

      // Get conditions with counts
      const conditions = await this.prisma.product.groupBy({
        by: ['condition'],
        where: {
          isActive: true,
          isSold: false,
          condition: { not: '' },
        },
        _count: true,
      });

      return {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count,
        })),
        priceRange: {
          min: priceRange._min.discountedPrice || 0,
          max: priceRange._max.discountedPrice || 10000,
        },
        conditions: conditions.map(c => ({
          name: c.condition,
          count: c._count,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get facets:', error);
      return {
        categories: [],
        priceRange: { min: 0, max: 10000 },
        conditions: [],
      };
    }
  }

  /**
   * Get product select fields
   */
  private getProductSelect() {
    return {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      category: true,
      originalPrice: true,
      discountedPrice: true,
      condition: true,
      tags: true,
      views: true,
      stock: true,
      isSold: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePic: true,
          rating: true,
          totalRatings: true,
          premiumTier: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
        },
        take: 3,
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    };
  }

  /**
   * Enrich product with calculated fields
   */
  private enrichProduct(product: any) {
    const averageRating = this.calculateAverageRating(product.reviews);
    const discount = this.calculateDiscount(
      product.originalPrice,
      product.discountedPrice,
    );

    return {
      ...product,
      averageRating,
      totalReviews: product._count?.reviews || 0,
      discount,
      savings: product.originalPrice - product.discountedPrice,
    };
  }

  /**
   * Calculate average rating
   */
  private calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  /**
   * Calculate discount percentage
   */
  private calculateDiscount(originalPrice: number, discountedPrice: number): number {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }

  /**
   * Get sort order for MeiliSearch
   */
  private getSortOrder(sortBy?: string): string[] {
    switch (sortBy) {
      case 'price-asc':
        return ['discountedPrice:asc'];
      case 'price-desc':
        return ['discountedPrice:desc'];
      case 'newest':
        return ['createdAt:desc'];
      case 'popular':
        return ['views:desc', 'createdAt:desc'];
      case 'relevance':
      default:
        return []; // MeiliSearch default relevance
    }
  }

  /**
   * Get sort order for database
   */
  private getDatabaseSortOrder(sortBy?: string): any {
    switch (sortBy) {
      case 'price-asc':
        return { discountedPrice: 'asc' };
      case 'price-desc':
        return { discountedPrice: 'desc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'popular':
        return [{ views: 'desc' }, { createdAt: 'desc' }];
      case 'relevance':
      default:
        return { createdAt: 'desc' };
    }
  }

  /**
   * Build empty result
   */
  private buildEmptyResult(page: number, limit: number): SearchResult {
    return {
      products: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
      filters: {
        categories: [],
        priceRange: { min: 0, max: 10000 },
        conditions: [],
      },
    };
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // Get title suggestions from database
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          title: true,
        },
        take: limit,
        orderBy: {
          views: 'desc',
        },
      });

      return [...new Set(products.map(p => p.title))];
    } catch (error) {
      this.logger.error('Failed to get autocomplete suggestions:', error);
      return [];
    }
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit: number = 10): Promise<string[]> {
    try {
      // Get most viewed products' titles as trending
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          isSold: false,
        },
        select: {
          title: true,
          category: true,
        },
        orderBy: {
          views: 'desc',
        },
        take: limit,
      });

      const trending = [
        ...products.map(p => p.title),
        ...products.map(p => p.category),
      ];

      // Remove duplicates and return
      return [...new Set(trending)].slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get trending searches:', error);
      return [];
    }
  }
}
