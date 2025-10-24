import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';
import { ConfigService } from '@nestjs/config';

export interface ProductDocument {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  tags: string[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  imageUrl: string[];
  userId: number;
  stock: number;
  isActive: boolean;
  isSold: boolean;
  createdAt: number;
  updatedAt: number;
}

@Injectable()
export class MeiliSearchService implements OnModuleInit {
  private readonly logger = new Logger(MeiliSearchService.name);
  private client: MeiliSearch;
  private productsIndex: Index;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MEILI_HOST') || 'http://localhost:7700';
    const apiKey = this.configService.get<string>('MEILI_ADMIN_KEY');

    if (!apiKey) {
      this.logger.error('❌ MEILI_ADMIN_KEY is not configured in .env');
      throw new Error('MeiliSearch API key is required');
    }

    this.client = new MeiliSearch({
      host,
      apiKey,
    });

    this.logger.log(`✅ MeiliSearch client initialized: ${host}`);
  }

  async onModuleInit() {
    try {
      // Verify connection
      const health = await this.client.health();
      this.logger.log(`✅ MeiliSearch health check: ${health.status}`);

      // Get or create products index
      this.productsIndex = this.client.index('products');
      
      // Try to verify index exists, create if it doesn't
      try {
        const indexInfo = await this.productsIndex.fetchInfo();
        this.logger.log(`✅ Connected to index: ${indexInfo.uid}`);
      } catch (error) {
        if (error.cause?.code === 'index_not_found') {
          this.logger.warn('⚠️ Products index not found, creating it...');
          await this.client.createIndex('products', { primaryKey: 'id' });
          this.logger.log('✅ Created products index');
          
          // Configure searchable and filterable attributes
          await this.productsIndex.updateSearchableAttributes([
            'title',
            'description',
            'tags',
            'category',
            'condition',
          ]);
          
          await this.productsIndex.updateFilterableAttributes([
            'category',
            'condition',
            'discount',
            'originalPrice',
            'discountedPrice',
            'createdAt',
          ]);
          
          await this.productsIndex.updateSortableAttributes([
            'createdAt',
            'originalPrice',
            'discountedPrice',
            'discount',
          ]);
          
          this.logger.log('✅ Configured products index attributes');
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('❌ Failed to initialize MeiliSearch:', error.message);
      throw error;
    }
  }

  /**
   * Index a single product
   */
  async indexProduct(product: any): Promise<void> {
    try {
      const document = this.transformProductToDocument(product);
      await this.productsIndex.addDocuments([document]);
      this.logger.log(`✅ Indexed product: ${product.id} - ${product.title}`);
    } catch (error) {
      this.logger.error(`❌ Failed to index product ${product.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Index multiple products in bulk
   */
  async indexProducts(products: any[]): Promise<void> {
    try {
      const documents = products.map(p => this.transformProductToDocument(p));
      const response = await this.productsIndex.addDocuments(documents);
      this.logger.log(`✅ Bulk indexed ${products.length} products. TaskUID: ${response.taskUid}`);
    } catch (error) {
      this.logger.error('❌ Failed to bulk index products:', error.message);
      throw error;
    }
  }

  /**
   * Update a product in the search index
   */
  async updateProduct(productId: number, product: any): Promise<void> {
    try {
      const document = this.transformProductToDocument(product);
      await this.productsIndex.updateDocuments([document]);
      this.logger.log(`✅ Updated product in index: ${productId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update product ${productId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a product from the search index
   */
  async deleteProduct(productId: number): Promise<void> {
    try {
      await this.productsIndex.deleteDocument(productId);
      this.logger.log(`✅ Deleted product from index: ${productId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to delete product ${productId}:`, error.message);
      throw error;
    }
  }

  /**
   * Search products with filters and sorting
   */
  async searchProducts(
    query: string,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      userId?: number;
      isActive?: boolean;
    },
    options?: {
      limit?: number;
      offset?: number;
      sort?: string[];
    }
  ) {
    try {
      const filterArray: string[] = [];

      // Build filter string
      if (filters?.category) {
        filterArray.push(`category = "${filters.category}"`);
      }
      if (filters?.minPrice !== undefined) {
        filterArray.push(`discountedPrice >= ${filters.minPrice}`);
      }
      if (filters?.maxPrice !== undefined) {
        filterArray.push(`discountedPrice <= ${filters.maxPrice}`);
      }
      if (filters?.condition) {
        filterArray.push(`condition = "${filters.condition}"`);
      }
      if (filters?.userId !== undefined) {
        filterArray.push(`userId = ${filters.userId}`);
      }
      if (filters?.isActive !== undefined) {
        filterArray.push(`isActive = ${filters.isActive}`);
      }

      const searchParams: any = {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      };

      if (filterArray.length > 0) {
        searchParams.filter = filterArray;
      }

      if (options?.sort && options.sort.length > 0) {
        searchParams.sort = options.sort;
      }

      const results = await this.productsIndex.search(query, searchParams);

      this.logger.log(`🔍 Search query: "${query}" - Found ${results.hits.length} results`);

      return {
        hits: results.hits,
        total: results.estimatedTotalHits,
        limit: results.limit,
        offset: results.offset,
        processingTimeMs: results.processingTimeMs,
      };
    } catch (error) {
      this.logger.error('❌ Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Get search index statistics
   */
  async getIndexStats() {
    try {
      const stats = await this.productsIndex.getStats();
      return stats;
    } catch (error) {
      this.logger.error('❌ Failed to get index stats:', error.message);
      throw error;
    }
  }

  /**
   * Sync all products from database to MeiliSearch
   */
  async syncAllProducts(products: any[]): Promise<void> {
    try {
      this.logger.log(`🔄 Starting sync of ${products.length} products...`);
      await this.indexProducts(products);
      this.logger.log(`✅ Sync completed successfully`);
    } catch (error) {
      this.logger.error('❌ Sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Clear all documents from the index
   */
  async clearIndex(): Promise<void> {
    try {
      await this.productsIndex.deleteAllDocuments();
      this.logger.warn('⚠️ All products deleted from search index');
    } catch (error) {
      this.logger.error('❌ Failed to clear index:', error.message);
      throw error;
    }
  }

  /**
   * Transform Prisma product to MeiliSearch document
   */
  private transformProductToDocument(product: any): ProductDocument {
    // Calculate discount percentage
    const discount = product.originalPrice > 0
      ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
      : 0;

    return {
      id: product.id,
      title: product.title || '',
      description: product.description || '',
      category: product.category || '',
      condition: product.condition || '',
      tags: Array.isArray(product.tags) ? product.tags : [],
      originalPrice: product.originalPrice || 0,
      discountedPrice: product.discountedPrice || 0,
      discount,
      imageUrl: Array.isArray(product.imageUrl) ? product.imageUrl : [],
      userId: product.userId,
      stock: product.stock || 0,
      isActive: product.isActive !== false,
      isSold: product.isSold === true,
      createdAt: product.createdAt ? new Date(product.createdAt).getTime() : Date.now(),
      updatedAt: product.updatedAt ? new Date(product.updatedAt).getTime() : Date.now(),
    };
  }

  /**
   * Get MeiliSearch client for advanced operations
   */
  getClient(): MeiliSearch {
    return this.client;
  }

  /**
   * Get products index for direct access
   */
  getProductsIndex(): Index {
    return this.productsIndex;
  }
}
