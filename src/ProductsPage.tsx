import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types (inlined from your api.ts)
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

export interface GetProductsParams {
  limit?: number;
  cursor?: string;
  q?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Mock API (replace with real imports from your api.ts)
// ---------------------------------------------------------------------------

const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Electronics" },
  { id: "2", name: "Clothing" },
  { id: "3", name: "Books" },
  { id: "4", name: "Home & Garden" },
  { id: "5", name: "Sports" },
];

const ALL_MOCK_PRODUCTS: Product[] = Array.from({ length: 47 }, (_, i) => ({
  id: `prod-${String(i + 1).padStart(4, "0")}`,
  name: [
    "Wireless Noise-Cancelling Headphones",
    "Merino Wool Crew Neck Sweater",
    "The Pragmatic Programmer",
    "Cast Iron Dutch Oven",
    "Carbon Fibre Road Bike",
    "Smart LED Desk Lamp",
    "Slim Fit Chino Trousers",
    "Clean Code: A Handbook",
    "Bamboo Kitchen Utensil Set",
    "Adjustable Dumbbell Set",
    "Mechanical Keyboard TKL",
    "Linen Button-Up Shirt",
    "Designing Data-Intensive Applications",
    "Ceramic Pour-Over Coffee Set",
    "Running Shoes Pro 3",
  ][i % 15],
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  category: MOCK_CATEGORIES[i % MOCK_CATEGORIES.length],
}));

async function getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
  await new Promise((r) => setTimeout(r, 400));
  let filtered = [...ALL_MOCK_PRODUCTS];
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (params.categoryId) {
    filtered = filtered.filter((p) => String(p.category.id) === params.categoryId);
  }
  if (params.startDate) {
    filtered = filtered.filter((p) => new Date(p.createdAt) >= new Date(params.startDate!));
  }
  if (params.endDate) {
    filtered = filtered.filter((p) => new Date(p.createdAt) <= new Date(params.endDate!));
  }
  const limit = params.limit ?? 12;
  const cursorIndex = params.cursor ? filtered.findIndex((p) => p.id === params.cursor) + 1 : 0;
  const page = filtered.slice(cursorIndex, cursorIndex + limit);
  const nextCursor = cursorIndex + limit < filtered.length ? page[page.length - 1]?.id ?? null : null;
  return { data: page, nextCursor };
}

async function getCategories(): Promise<CategoriesResponse> {
  await new Promise((r) => setTimeout(r, 200));
  return { data: MOCK_CATEGORIES };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CategoryBadge({ name }: { name: string }) {
  const palette: Record<string, string> = {
    Electronics: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    Clothing: "bg-rose-50 text-rose-700 ring-rose-200",
    Books: "bg-amber-50 text-amber-700 ring-amber-200",
    "Home & Garden": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Sports: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  const cls = palette[name] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="mb-3 h-3 w-20 rounded bg-slate-100" />
      <div className="mb-2 h-5 w-4/5 rounded bg-slate-200" />
      <div className="h-4 w-2/5 rounded bg-slate-100" />
      <div className="mt-5 flex items-center justify-between">
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50">
      <p className="mb-1.5 font-mono text-[11px] tracking-widest text-slate-400 uppercase">
        {product.id}
      </p>
      <h3 className="mb-1 text-sm font-semibold text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
        {product.name}
      </h3>
      <div className="mt-4 flex items-center justify-between">
        <CategoryBadge name={product.category.name} />
        <time className="font-mono text-[11px] text-slate-400" dateTime={product.createdAt}>
          {formatDate(product.createdAt)}
        </time>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Filter Chip
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap border ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 12;

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch categories once
  useEffect(() => {
    getCategories().then((r) => setCategories(r.data));
  }, []);

  // Fetch products when filters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setProducts([]);
    setNextCursor(null);
    try {
      const res = await getProducts({
        limit: LIMIT,
        q: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setProducts(res.data);
      setNextCursor(res.nextCursor);
      setTotalFetched(res.data.length);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, startDate, endDate]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Load more
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getProducts({
        limit: LIMIT,
        cursor: nextCursor,
        q: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setProducts((prev) => [...prev, ...res.data]);
      setNextCursor(res.nextCursor);
      setTotalFetched((prev) => prev + res.data.length);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasActiveFilters = !!(categoryId || startDate || endDate || search);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-900 tracking-tight">Products</span>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

          {/* Sidebar filters */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="sticky top-24 space-y-6">

              {/* Category filter */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Category</p>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
                  <FilterChip
                    label="All"
                    active={!categoryId}
                    onClick={() => setCategoryId("")}
                  />
                  {categories.map((cat) => (
                    <FilterChip
                      key={cat.id}
                      label={cat.name}
                      active={String(cat.id) === categoryId}
                      onClick={() =>
                        setCategoryId((prev) =>
                          prev === String(cat.id) ? "" : String(cat.id)
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Date Added</p>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                {!loading && (
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-800">{totalFetched}</span>
                    {nextCursor ? "+" : ""} product{totalFetched !== 1 ? "s" : ""}
                    {hasActiveFilters && (
                      <span className="ml-1 text-indigo-500">filtered</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">No products found</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or search term.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load more */}
                {nextCursor && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="h-4 w-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Loading…
                        </>
                      ) : (
                        "Load more"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}