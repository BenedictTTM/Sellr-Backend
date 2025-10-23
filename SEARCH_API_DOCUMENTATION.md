# 🔍 Advanced Search API Documentation

## Overview

Your Sellr backend now has a comprehensive search system with:

- ⚡ Lightning-fast MeiliSearch integration
- 🎯 Advanced filtering and sorting
- 📄 Pagination support
- 🔮 Autocomplete suggestions
- 📈 Trending searches
- 🛡️ Automatic fallback to database

---

## 📡 Search Endpoints

### 1. Main Search Endpoint

**Endpoint**: `GET /products/search`

**Description**: Advanced product search with filters, sorting, and pagination

#### Query Parameters

| Parameter   | Type   | Required | Default     | Description                    |
| ----------- | ------ | -------- | ----------- | ------------------------------ |
| `q`         | string | No       | `""`        | Search query (supports typos!) |
| `category`  | string | No       | -           | Filter by category             |
| `minPrice`  | number | No       | -           | Minimum price filter           |
| `maxPrice`  | number | No       | -           | Maximum price filter           |
| `condition` | string | No       | -           | Filter by condition            |
| `tags`      | string | No       | -           | Comma-separated tags           |
| `sortBy`    | string | No       | `relevance` | Sort order (see below)         |
| `page`      | number | No       | `1`         | Page number                    |
| `limit`     | number | No       | `20`        | Results per page (max 100)     |

#### Sort Options

- `relevance` - Best matches first (default)
- `price-asc` - Lowest price first
- `price-desc` - Highest price first
- `newest` - Newest products first
- `popular` - Most viewed products first

#### Example Requests

**Basic Search**

```http
GET /products/search?q=laptop
```

**Search with Category Filter**

```http
GET /products/search?q=laptop&category=Electronics
```

**Search with Price Range**

```http
GET /products/search?q=phone&minPrice=200&maxPrice=800
```

**Search with Multiple Filters**

```http
GET /products/search?q=gaming&category=Electronics&minPrice=500&maxPrice=2000&condition=New&sortBy=price-asc
```

**Paginated Search**

```http
GET /products/search?q=laptop&page=2&limit=10
```

**Search by Tags**

```http
GET /products/search?tags=gaming,laptop,nvidia
```

#### Response Format

```json
{
  "products": [
    {
      "id": 123,
      "title": "Gaming Laptop",
      "description": "High-performance gaming laptop...",
      "imageUrl": ["https://..."],
      "category": "Electronics",
      "originalPrice": 1500,
      "discountedPrice": 1200,
      "discount": 20,
      "savings": 300,
      "condition": "New",
      "tags": ["gaming", "laptop", "nvidia"],
      "views": 450,
      "stock": 5,
      "isSold": false,
      "averageRating": 4.5,
      "totalReviews": 12,
      "createdAt": "2025-10-20T10:30:00Z",
      "user": {
        "id": 45,
        "username": "seller123",
        "firstName": "John",
        "lastName": "Doe",
        "profilePic": "https://...",
        "rating": 4.8,
        "premiumTier": "GOLD"
      },
      "images": [{ "id": 1, "url": "https://..." }]
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasMore": true,
  "filters": {
    "categories": [
      { "name": "Electronics", "count": 89 },
      { "name": "Fashion", "count": 45 }
    ],
    "priceRange": {
      "min": 10,
      "max": 5000
    },
    "conditions": [
      { "name": "New", "count": 120 },
      { "name": "Used", "count": 36 }
    ]
  }
}
```

---

### 2. Autocomplete Endpoint

**Endpoint**: `GET /products/search/autocomplete`

**Description**: Get search suggestions as user types

#### Query Parameters

| Parameter | Type   | Required | Default | Description                    |
| --------- | ------ | -------- | ------- | ------------------------------ |
| `q`       | string | Yes      | -       | Search query (min 2 chars)     |
| `limit`   | number | No       | `5`     | Number of suggestions (max 10) |

#### Example Request

```http
GET /products/search/autocomplete?q=gam&limit=5
```

#### Response Format

```json
{
  "suggestions": [
    "Gaming Laptop",
    "Gaming Mouse",
    "Gaming Keyboard",
    "Gaming Chair",
    "Gaming Headset"
  ]
}
```

---

### 3. Trending Searches Endpoint

**Endpoint**: `GET /products/search/trending`

**Description**: Get trending/popular search terms

#### Query Parameters

| Parameter | Type   | Required | Default | Description                       |
| --------- | ------ | -------- | ------- | --------------------------------- |
| `limit`   | number | No       | `10`    | Number of trending items (max 20) |

#### Example Request

```http
GET /products/search/trending?limit=10
```

#### Response Format

```json
{
  "trending": [
    "Gaming Laptop",
    "iPhone 15",
    "MacBook Pro",
    "PlayStation 5",
    "Nike Shoes",
    "Samsung TV",
    "AirPods",
    "Gaming Chair",
    "Mechanical Keyboard",
    "Webcam"
  ]
}
```

---

## 🧪 Testing Examples

### PowerShell Examples

```powershell
# Basic search
Invoke-RestMethod -Uri "http://localhost:3001/products/search?q=laptop"

# Search with filters
Invoke-RestMethod -Uri "http://localhost:3001/products/search?q=phone&category=Electronics&minPrice=200&maxPrice=800&sortBy=price-asc"

# Autocomplete
Invoke-RestMethod -Uri "http://localhost:3001/products/search/autocomplete?q=gam"

# Trending searches
Invoke-RestMethod -Uri "http://localhost:3001/products/search/trending"

# Paginated search
Invoke-RestMethod -Uri "http://localhost:3001/products/search?q=laptop&page=2&limit=10"
```

### cURL Examples

```bash
# Basic search
curl "http://localhost:3001/products/search?q=laptop"

# Search with filters
curl "http://localhost:3001/products/search?q=phone&category=Electronics&minPrice=200&maxPrice=800&sortBy=price-asc"

# Autocomplete
curl "http://localhost:3001/products/search/autocomplete?q=gam"

# Trending searches
curl "http://localhost:3001/products/search/trending"
```

### JavaScript/TypeScript Example

```typescript
// Basic search
const searchProducts = async (query: string) => {
  const response = await fetch(
    `http://localhost:3001/products/search?q=${encodeURIComponent(query)}`,
  );
  return response.json();
};

// Advanced search with filters
const advancedSearch = async (params: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (params.query) queryParams.append('q', params.query);
  if (params.category) queryParams.append('category', params.category);
  if (params.minPrice)
    queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice)
    queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(
    `http://localhost:3001/products/search?${queryParams.toString()}`,
  );
  return response.json();
};

// Autocomplete
const getAutocomplete = async (query: string) => {
  const response = await fetch(
    `http://localhost:3001/products/search/autocomplete?q=${encodeURIComponent(query)}`,
  );
  const data = await response.json();
  return data.suggestions;
};

// Trending
const getTrending = async () => {
  const response = await fetch(
    'http://localhost:3001/products/search/trending',
  );
  const data = await response.json();
  return data.trending;
};
```

---

## 🎯 Use Cases

### 1. Simple Search Box

```typescript
// User types "laptop" in search box
const results = await fetch('/products/search?q=laptop');
// Returns: All products matching "laptop"
```

### 2. Category Page with Search

```typescript
// Electronics category with search
const results = await fetch('/products/search?category=Electronics&q=phone');
// Returns: Only phones in Electronics category
```

### 3. Price Range Filter

```typescript
// Show laptops between $500-$1500
const results = await fetch(
  '/products/search?q=laptop&minPrice=500&maxPrice=1500',
);
// Returns: Laptops in price range
```

### 4. Sort by Price

```typescript
// Show cheapest phones first
const results = await fetch('/products/search?q=phone&sortBy=price-asc');
// Returns: Phones sorted by price (low to high)
```

### 5. Popular Products

```typescript
// Show most viewed products
const results = await fetch('/products/search?sortBy=popular&limit=10');
// Returns: Top 10 most viewed products
```

### 6. Search Autocomplete

```typescript
// As user types "gam"
const suggestions = await fetch('/products/search/autocomplete?q=gam');
// Returns: ["Gaming Laptop", "Gaming Mouse", ...]
```

### 7. Trending Section

```typescript
// Show trending searches on homepage
const trending = await fetch('/products/search/trending?limit=5');
// Returns: Top 5 trending search terms
```

---

## 🎨 Frontend Integration Example

### React Component

```typescript
import { useState, useEffect } from 'react';

interface SearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page: number;
}

export function ProductSearch() {
  const [params, setParams] = useState<SearchParams>({
    query: '',
    page: 1,
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchProducts();
  }, [params]);

  const searchProducts = async () => {
    setLoading(true);

    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('q', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('page', params.page.toString());

    try {
      const response = await fetch(`/api/products/search?${queryParams}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={params.query}
        onChange={(e) => setParams({ ...params, query: e.target.value, page: 1 })}
        placeholder="Search products..."
      />

      <select
        value={params.sortBy}
        onChange={(e) => setParams({ ...params, sortBy: e.target.value, page: 1 })}
      >
        <option value="relevance">Best Match</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="newest">Newest</option>
        <option value="popular">Most Popular</option>
      </select>

      {loading && <p>Loading...</p>}

      {results && (
        <>
          <p>Found {results.total} products</p>

          <div className="products-grid">
            {results.products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {results.hasMore && (
            <button onClick={() => setParams({ ...params, page: params.page + 1 })}>
              Load More
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

---

## ⚡ Performance

### Response Times

- **MeiliSearch**: 10-50ms (typical)
- **Database Fallback**: 100-500ms (depends on dataset size)

### Optimizations

- ✅ Automatic caching in MeiliSearch
- ✅ Indexed fields for fast filtering
- ✅ Pagination to limit data transfer
- ✅ Selective field loading (only needed data)

---

## 🛡️ Error Handling

The search system handles errors gracefully:

1. **MeiliSearch Down**: Automatically falls back to database search
2. **Invalid Parameters**: Returns empty results with proper structure
3. **No Results**: Returns empty array with facets for filtering

All errors are logged for monitoring.

---

## 📊 Response Fields Explained

| Field                | Description                               |
| -------------------- | ----------------------------------------- |
| `products`           | Array of product objects                  |
| `total`              | Total number of matching products         |
| `page`               | Current page number                       |
| `limit`              | Results per page                          |
| `totalPages`         | Total number of pages                     |
| `hasMore`            | Boolean indicating more results available |
| `filters.categories` | Available categories with counts          |
| `filters.priceRange` | Min and max prices in results             |
| `filters.conditions` | Available conditions with counts          |

### Product Fields

| Field           | Description                        |
| --------------- | ---------------------------------- |
| `discount`      | Discount percentage (calculated)   |
| `savings`       | Amount saved (calculated)          |
| `averageRating` | Average review rating (calculated) |
| `totalReviews`  | Number of reviews                  |
| `user`          | Seller information                 |
| `images`        | Product images (first 3)           |

---

## 🎓 Best Practices

### 1. Use Pagination

Always paginate large result sets:

```http
GET /products/search?q=laptop&page=1&limit=20
```

### 2. Implement Debouncing

For autocomplete, debounce user input:

```typescript
const debouncedSearch = debounce((query) => {
  searchAutocomplete(query);
}, 300);
```

### 3. Cache Trending Searches

Cache trending searches on the frontend:

```typescript
// Fetch once every 5 minutes
const trending = useCachedData('/products/search/trending', 5 * 60 * 1000);
```

### 4. Handle Empty States

Show helpful messages when no results:

```typescript
if (results.total === 0) {
  return <NoResults query={query} suggestions={results.filters.categories} />;
}
```

### 5. Progressive Loading

Load more results as user scrolls:

```typescript
useInfiniteScroll(() => {
  if (results.hasMore) {
    loadMoreResults();
  }
});
```

---

## 🚀 Status

✅ **Search endpoints created and ready to use!**

Start your backend and test the search functionality! 🎉
