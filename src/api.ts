const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Category {
  id: number | string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  createdAt: string;
  category: Category;
}

export interface ProductsResponse {
  data: Product[];
  nextCursor: string | null;
}

export interface CategoriesResponse {
  data: Category[];
}

// ---------------------------------------------------------------------------
// Query Params
// ---------------------------------------------------------------------------

export interface GetProductsParams {
  limit?: number;

  cursor?: string;

  q?: string;

  categoryId?: string; // 🔥 FIXED (was category)

  startDate?: string;

  endDate?: string;
}

// ---------------------------------------------------------------------------
// Helper: build query string safely
// ---------------------------------------------------------------------------

function buildQuery(params: Record<string, any>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

// ---------------------------------------------------------------------------
// API Call - Products
// ---------------------------------------------------------------------------

export async function getProducts(
  params: GetProductsParams = {}
): Promise<ProductsResponse> {
  const query = buildQuery(params);

  const res = await fetch(`${API_BASE}/products?${query}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  return await res.json();
}

// ---------------------------------------------------------------------------
// Fetch categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<CategoriesResponse> {
  const res = await fetch(`${API_BASE}/categories`);

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }

  return await res.json();
}