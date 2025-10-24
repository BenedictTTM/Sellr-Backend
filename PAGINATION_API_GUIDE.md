# 📄 Pagination API Guide

## Overview

All product listing endpoints now support **cursor-based pagination** to improve performance and prevent loading all products at once.

## Why Pagination?

- ⚡ **Performance**: Load only what you need
- 🚀 **Speed**: Faster page loads and better UX
- 💾 **Memory**: Reduced memory footprint
- 📱 **Mobile**: Better experience on mobile devices

---

## API Endpoints with Pagination

### 1. Get All Products

```
GET /products?page=1&limit=20
```

**Query Parameters:**

- `page` (optional, default: 1) - Page number (min: 1)
- `limit` (optional, default: 20) - Items per page (min: 1, max: 100)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Product Name",
      "description": "Product description",
      "imageUrl": ["url1", "url2"],
      "category": "Electronics",
      "originalPrice": 100.0,
      "discountedPrice": 80.0,
      "stock": 10,
      "condition": "new",
      "tags": ["tag1", "tag2"],
      "views": 150,
      "isActive": true,
      "isSold": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "profilePic": "url",
        "rating": 4.5,
        "premiumTier": "GOLD"
      },
      "images": [{ "id": 1, "url": "image_url" }],
      "averageRating": 4.5,
      "totalReviews": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### 2. Get Products by Category

```
GET /products/category/:category?page=1&limit=20
```

**Example:**

```
GET /products/category/Electronics?page=2&limit=15
```

**Response:** Same structure as above

---

### 3. Get Products by User ID

```
GET /products/user/:userId?page=1&limit=20
```

**Example:**

```
GET /products/user/123?page=1&limit=10
```

**Response:** Same structure as above

---

### 4. Get My Products (Authenticated)

```
GET /products/user/me?page=1&limit=20
```

**Headers Required:**

```
Cookie: access_token=your_jwt_token
```

**Response:** Same structure as above

---

## Frontend Implementation Examples

### React/Next.js with SWR

```typescript
import useSWR from 'swr';

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ProductResponse {
  data: Product[];
  pagination: PaginationMeta;
}

export function useProducts(page: number = 1, limit: number = 20) {
  const { data, error, isLoading } = useSWR<ProductResponse>(
    `/api/products?page=${page}&limit=${limit}`,
    fetcher,
  );

  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
  };
}
```

### Usage in Component

```typescript
'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const { products, pagination, isLoading } = useProducts(page, 20);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          disabled={!pagination?.hasPreviousPage}
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="px-4 py-2">
          Page {pagination?.page} of {pagination?.totalPages}
        </span>

        <button
          disabled={!pagination?.hasNextPage}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Results Info */}
      <div className="text-center mt-4 text-gray-600">
        Showing {products.length} of {pagination?.totalCount} products
      </div>
    </div>
  );
}
```

---

### Infinite Scroll Implementation

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

export default function InfiniteScrollProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const lastProductRef = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?page=${page}&limit=20`);
      const data: ProductResponse = await res.json();

      setProducts(prev => [...prev, ...data.data]);
      setHasMore(data.pagination.hasNextPage);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    });

    if (lastProductRef.current) {
      observerRef.current.observe(lastProductRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            ref={index === products.length - 1 ? lastProductRef : null}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      {isLoading && <div>Loading more...</div>}
    </div>
  );
}
```

---

### React Query Implementation

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

const fetchProducts = async ({ pageParam = 1 }) => {
  const res = await fetch(`/api/products?page=${pageParam}&limit=20`);
  return res.json();
};

export function useInfiniteProducts() {
  return useInfiniteQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined;
    },
  });
}

// Usage
function ProductsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.data.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. **Choose the Right Limit**

```typescript
// Mobile: Smaller limit for faster loads
const mobileLimit = 10;

// Desktop: Larger limit for better UX
const desktopLimit = 24;

// Use responsive hook
const limit = useIsMobile() ? mobileLimit : desktopLimit;
```

### 2. **Cache Strategy**

```typescript
// SWR with revalidation
const { data } = useSWR(`/api/products?page=${page}`, fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
});
```

### 3. **Loading States**

```typescript
// Skeleton loading
{isLoading && <ProductsSkeleton count={20} />}

// Product grid with suspense
<Suspense fallback={<ProductsSkeleton />}>
  <ProductGrid page={page} />
</Suspense>
```

### 4. **URL State Management**

```typescript
// Keep page in URL for shareable links
const searchParams = useSearchParams();
const page = parseInt(searchParams.get('page') || '1');

// Update URL on page change
const handlePageChange = (newPage: number) => {
  router.push(`/products?page=${newPage}`);
};
```

### 5. **Prefetch Next Page**

```typescript
useEffect(() => {
  if (pagination?.hasNextPage) {
    // Prefetch next page
    fetch(`/api/products?page=${page + 1}&limit=${limit}`);
  }
}, [page, pagination]);
```

---

## Performance Tips

1. **Use Virtual Scrolling** for very large lists (react-window, react-virtualized)
2. **Implement skeleton loading** for better perceived performance
3. **Debounce scroll events** when implementing infinite scroll
4. **Cache pagination data** to avoid refetching
5. **Show total count** to give users context
6. **Add page jump** for quick navigation

---

## Migration Checklist

- [ ] Update API calls to include `page` and `limit` parameters
- [ ] Handle pagination metadata in responses
- [ ] Implement pagination UI (buttons or infinite scroll)
- [ ] Add loading states for better UX
- [ ] Test edge cases (first page, last page, empty results)
- [ ] Update types/interfaces to include pagination
- [ ] Add error handling for failed requests
- [ ] Implement caching strategy
- [ ] Test on mobile devices
- [ ] Update documentation

---

## API Response Type Definition

```typescript
// types/product.ts
export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type ProductsResponse = PaginatedResponse<Product>;
```

---

## Testing Examples

```typescript
// Test pagination logic
describe('Products Pagination', () => {
  it('should load first page', async () => {
    const res = await fetch('/api/products?page=1&limit=20');
    const data = await res.json();

    expect(data.pagination.page).toBe(1);
    expect(data.data.length).toBeLessThanOrEqual(20);
  });

  it('should handle invalid page numbers', async () => {
    const res = await fetch('/api/products?page=-1&limit=20');
    const data = await res.json();

    // Backend validates and defaults to page 1
    expect(data.pagination.page).toBe(1);
  });

  it('should respect max limit', async () => {
    const res = await fetch('/api/products?page=1&limit=500');
    const data = await res.json();

    // Backend caps at 100
    expect(data.pagination.limit).toBeLessThanOrEqual(100);
  });
});
```

---

## Questions?

Contact the backend team or check the Postman collection for live examples.

**Happy coding! 🚀**
