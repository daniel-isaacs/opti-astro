<script lang="ts">
    interface Facet { name: string; count: number; }
    interface Product {
        product_id?: string | null;
        product_name?: string | null;
        brand?: string | null;
        sku?: string | null;
        currency?: string | null;
        price?: number | null;
        sale_price?: number | null;
        category?: string | null;
        subcategory?: string | null;
        slug?: string | null;
        is_active?: boolean | null;
    }
    interface Props {
        limit: number;
        initialItems: Product[];
        initialTotal: number;
        initialFacets: { brands: Facet[]; categories: Facet[]; subcategories: Facet[]; };
    }

    let { limit, initialItems, initialTotal, initialFacets }: Props = $props();

    let items = $state<Product[]>(initialItems);
    let total = $state(initialTotal);
    let isLoading = $state(false);

    // Filter state
    let selectedBrand = $state('');
    let selectedCategory = $state('');
    let selectedSubcategory = $state('');
    let selectedPriceRange = $state('');
    let onSaleOnly = $state(false);
    let includeInactive = $state(false);

    let hasActiveFilters = $derived(
        selectedBrand !== '' || selectedCategory !== '' || selectedSubcategory !== '' ||
        selectedPriceRange !== '' || onSaleOnly || includeInactive
    );

    const priceRanges = [
        { label: 'Under $50', min: '0', max: '50' },
        { label: '$50 – $100', min: '50', max: '100' },
        { label: '$100 – $250', min: '100', max: '250' },
        { label: '$250 – $500', min: '250', max: '500' },
        { label: '$500+', min: '500', max: '' },
    ];

    async function fetchProducts() {
        isLoading = true;
        try {
            const params = new URLSearchParams();
            if (limit) params.append('limit', limit.toString());
            if (selectedBrand) params.append('brand', selectedBrand);
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
            if (selectedPriceRange) {
                const range = priceRanges.find(r => r.label === selectedPriceRange);
                if (range) {
                    if (range.min) params.append('minPrice', range.min);
                    if (range.max) params.append('maxPrice', range.max);
                }
            }
            if (onSaleOnly) params.append('onSale', 'true');
            if (includeInactive) params.append('includeInactive', 'true');

            const response = await fetch(`/api/products.json?${params.toString()}`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            items = data.items || [];
            total = data.total || 0;
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            isLoading = false;
        }
    }

    function handleFilterChange() {
        fetchProducts();
    }

    function clearFilters() {
        selectedBrand = '';
        selectedCategory = '';
        selectedSubcategory = '';
        selectedPriceRange = '';
        onSaleOnly = false;
        includeInactive = false;
        fetchProducts();
    }

    function formatPrice(value: number): string {
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
</script>

<div class="product-list-filter">
    <!-- Filters -->
    <div class="bg-base-200 rounded-lg p-4 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
            <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
                <label class="label" for="brand-filter"><span class="label-text">Brand</span></label>
                <select id="brand-filter" class="select select-bordered select-sm" bind:value={selectedBrand} onchange={handleFilterChange}>
                    <option value="">All brands</option>
                    {#each initialFacets.brands as facet}
                        <option value={facet.name}>{facet.name} ({facet.count})</option>
                    {/each}
                </select>
            </div>

            <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
                <label class="label" for="category-filter"><span class="label-text">Category</span></label>
                <select id="category-filter" class="select select-bordered select-sm" bind:value={selectedCategory} onchange={handleFilterChange}>
                    <option value="">All categories</option>
                    {#each initialFacets.categories as facet}
                        <option value={facet.name}>{facet.name} ({facet.count})</option>
                    {/each}
                </select>
            </div>

            <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
                <label class="label" for="subcategory-filter"><span class="label-text">Subcategory</span></label>
                <select id="subcategory-filter" class="select select-bordered select-sm" bind:value={selectedSubcategory} onchange={handleFilterChange}>
                    <option value="">All subcategories</option>
                    {#each initialFacets.subcategories as facet}
                        <option value={facet.name}>{facet.name} ({facet.count})</option>
                    {/each}
                </select>
            </div>

            <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
                <label class="label" for="price-filter"><span class="label-text">Price range</span></label>
                <select id="price-filter" class="select select-bordered select-sm" bind:value={selectedPriceRange} onchange={handleFilterChange}>
                    <option value="">Any price</option>
                    {#each priceRanges as range}
                        <option value={range.label}>{range.label}</option>
                    {/each}
                </select>
            </div>

            <div class="form-control">
                <label class="label cursor-pointer gap-2">
                    <span class="label-text">On sale</span>
                    <input type="checkbox" class="toggle toggle-sm toggle-primary" bind:checked={onSaleOnly} onchange={handleFilterChange} />
                </label>
            </div>

            <div class="form-control">
                <label class="label cursor-pointer gap-2">
                    <span class="label-text">Include inactive</span>
                    <input type="checkbox" class="toggle toggle-sm" bind:checked={includeInactive} onchange={handleFilterChange} />
                </label>
            </div>

            {#if hasActiveFilters}
                <button class="btn btn-ghost btn-sm" onclick={clearFilters}>Clear filters</button>
            {/if}
        </div>
    </div>

    <!-- Results count -->
    <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-base-content/60">
            Showing {items.length} of {total} product{total !== 1 ? 's' : ''}
        </p>
        {#if isLoading}
            <span class="loading loading-spinner loading-sm"></span>
        {/if}
    </div>

    <!-- Product cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each items as product}
            <div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
                <div class="card-body p-4 gap-2">
                    {#if !product.is_active}
                        <span class="badge badge-warning badge-sm">Inactive</span>
                    {/if}

                    <h3 class="card-title text-base">{product.product_name}</h3>

                    {#if product.brand}
                        <p class="text-sm text-base-content/70">{product.brand}</p>
                    {/if}

                    {#if product.category || product.subcategory}
                        <p class="text-xs text-base-content/50">
                            {product.category}{#if product.category && product.subcategory} &nbsp;&rsaquo;&nbsp; {/if}{product.subcategory}
                        </p>
                    {/if}

                    {#if product.sku}
                        <p class="text-xs text-base-content/40">SKU: {product.sku}</p>
                    {/if}

                    <div class="mt-auto pt-2">
                        <p class="text-xl font-bold" class:text-success={product.sale_price && product.sale_price > 0} class:text-primary={!product.sale_price || product.sale_price <= 0}>
                            {#if product.sale_price && product.sale_price > 0}
                                ${formatPrice(product.sale_price)}
                                <span class="text-sm font-normal text-base-content/40 line-through ml-2">${formatPrice(product.price ?? 0)}</span>
                            {:else if product.price != null}
                                ${formatPrice(product.price)}
                            {/if}
                        </p>
                    </div>
                </div>

                {#if product.sale_price && product.sale_price > 0}
                    <span class="absolute bottom-2 right-2 badge badge-success badge-sm text-white">Sale!</span>
                {/if}
            </div>
        {/each}
    </div>

    {#if items.length === 0 && !isLoading}
        <p class="text-center opacity-50 py-8">No products found matching your filters.</p>
    {/if}
</div>
