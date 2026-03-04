<script lang="ts">
    import { onMount } from 'svelte';
    import {
        OPTIMIZELY_GRAPH_GATEWAY,
        OPTIMIZELY_GRAPH_SINGLE_KEY,
    } from 'astro:env/client';
    import LoadingSpinner from './shared/_LoadingSpinner.svelte';
    import StatusMessage from './shared/_StatusMessage.svelte';

    interface ResultPage {
        title: string;
        path: string;
        fullUrl: string;
        locale: string;
        count: number;
    }

    interface CachedPage {
        title: string;
        path: string;
        fullUrl: string;
        locale: string;
        componentCounts: Record<string, number>;
    }

    const BATCH_SIZE = 10;

    let componentTypes = $state<{ key: string; displayName: string }[]>([]);
    let typesLoading = $state(true);
    let typesError = $state('');

    // In-memory index — persists across searches within the session
    let pageCache: CachedPage[] | null = null;
    let cacheBuilt = $state(false);

    onMount(async () => {
        try {
            const res = await fetch(
                '/opti-admin/api/component-usage/list-component-types.json'
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            componentTypes = data.types ?? [];
            if (componentTypes.length > 0) selectedType = componentTypes[0].key;
        } catch (err) {
            typesError = (err as Error).message;
        } finally {
            typesLoading = false;
        }
    });

    // Search state
    let selectedType = $state('');
    let searchLoading = $state(false);
    let verifyingIndex = $state(0);
    let verifyingTotal = $state(0);
    let results = $state<ResultPage[]>([]);
    let hasSearched = $state(false);

    // Filter
    let filterLocale = $state('all');

    // Status message
    let message = $state('');
    let messageType = $state<'success' | 'error'>('success');
    let showMessage = $state(false);

    function displayMessage(text: string, isSuccess: boolean) {
        message = text;
        messageType = isSuccess ? 'success' : 'error';
        showMessage = true;
        setTimeout(() => {
            showMessage = false;
        }, 5000);
    }

    let availableLocales = $derived(
        [...new Set(results.map((r) => r.locale).filter(Boolean))].sort()
    );

    let filteredResults = $derived(
        filterLocale === 'all'
            ? results
            : results.filter((r) => r.locale === filterLocale)
    );

    // Count all component types present in a composition tree in one pass
    function countAllComponents(
        node: any,
        acc: Record<string, number> = {}
    ): Record<string, number> {
        if (!node) return acc;
        if (node.__typename === 'CompositionComponentNode' && node.type) {
            acc[node.type] = (acc[node.type] ?? 0) + 1;
        }
        if (Array.isArray(node.nodes)) {
            for (const child of node.nodes) countAllComponents(child, acc);
        }
        return acc;
    }

    async function graphql(query: string, variables?: Record<string, string>) {
        const response = await fetch(
            `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2?auth=${OPTIMIZELY_GRAPH_SINGLE_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.errors)
            throw new Error(data.errors[0]?.message || 'GraphQL error');
        return data;
    }

    async function buildIndex(candidates: any[]): Promise<CachedPage[]> {
        verifyingTotal = candidates.length;
        verifyingIndex = 0;
        const built: CachedPage[] = [];

        for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
            const batch = candidates.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
                batch.map(async (candidate) => {
                    const key = candidate._metadata?.key;
                    if (!key) return null;
                    try {
                        const res = await graphql(
                            `
                                query GetPageJson($key: String!) {
                                    _Page(
                                        where: {
                                            _metadata: { key: { eq: $key } }
                                        }
                                    ) {
                                        item {
                                            _json
                                        }
                                    }
                                }
                            `,
                            { key }
                        );
                        const json = res.data?._Page?.item?._json;
                        const componentCounts = json
                            ? countAllComponents(json.composition)
                            : {};
                        const base = candidate._metadata?.url?.base ?? '';
                        const path = candidate._metadata?.url?.default ?? '';
                        return {
                            title:
                                candidate._metadata?.displayName || 'Untitled',
                            path,
                            fullUrl: path ? base + path : '',
                            locale: candidate._metadata?.locale || '',
                            componentCounts,
                        } satisfies CachedPage;
                    } catch {
                        return null;
                    }
                })
            );

            for (const r of batchResults) {
                if (r) built.push(r);
            }
            verifyingIndex = Math.min(i + BATCH_SIZE, candidates.length);
        }

        return built;
    }

    async function search() {
        if (!selectedType) return;

        searchLoading = true;
        hasSearched = true;
        results = [];
        filterLocale = 'all';
        showMessage = false;

        try {
            if (!OPTIMIZELY_GRAPH_GATEWAY || !OPTIMIZELY_GRAPH_SINGLE_KEY) {
                throw new Error(
                    'Missing GraphQL configuration. Check environment variables.'
                );
            }

            // Build index on first search; subsequent searches reuse it
            if (!pageCache) {
                verifyingIndex = 0;
                verifyingTotal = 0;

                const pass1 = await graphql(`
                    query GetExperiencePages {
                        BlankExperience(limit: 100) {
                            items {
                                _metadata {
                                    key
                                    displayName
                                    locale
                                    url {
                                        base
                                        default
                                    }
                                }
                            }
                        }
                    }
                `);
                const candidates = pass1.data?.BlankExperience?.items ?? [];

                pageCache = await buildIndex(candidates);
                cacheBuilt = true;
            }

            // Instant lookup from cache
            const confirmed: ResultPage[] = pageCache
                .filter((p) => (p.componentCounts[selectedType] ?? 0) > 0)
                .map((p) => ({
                    title: p.title,
                    path: p.path,
                    fullUrl: p.fullUrl,
                    locale: p.locale,
                    count: p.componentCounts[selectedType],
                }))
                .sort((a, b) => b.count - a.count);

            results = confirmed;
            const displayName =
                componentTypes.find((t) => t.key === selectedType)
                    ?.displayName ?? selectedType;
            displayMessage(
                `Found ${confirmed.length} page${confirmed.length === 1 ? '' : 's'} using ${displayName}`,
                true
            );
        } catch (error) {
            displayMessage(
                'Search failed: ' +
                    (error instanceof Error ? error.message : 'Unknown error'),
                false
            );
        } finally {
            searchLoading = false;
            verifyingIndex = 0;
            verifyingTotal = 0;
        }
    }

    function clearCache() {
        pageCache = null;
        cacheBuilt = false;
        results = [];
        hasSearched = false;
        showMessage = false;
        filterLocale = 'all';
    }
</script>

<div class="max-w-5xl">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Component Usage</h1>
        <p class="text-gray-600">
            Find all Experience pages that use a specific component to assess
            impact before making updates.
        </p>
    </div>

    {#if showMessage}
        <StatusMessage {message} type={messageType} />
    {/if}

    <!-- Controls -->
    <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200 mb-6">
        <div class="flex flex-col sm:flex-row gap-3 items-end">
            <div class="flex-1">
                <label
                    for="component-select"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Component type</label
                >
                {#if typesError}
                    <p class="text-sm text-red-600">
                        Failed to load types: {typesError}
                    </p>
                {:else}
                    <select
                        id="component-select"
                        bind:value={selectedType}
                        disabled={typesLoading}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50"
                    >
                        {#if typesLoading}
                            <option value="">Loading component types...</option>
                        {:else}
                            {#each componentTypes as type}
                                <option value={type.key}
                                    >{type.displayName}</option
                                >
                            {/each}
                        {/if}
                    </select>
                {/if}
            </div>

            {#if hasSearched && availableLocales.length > 1}
                <div>
                    <label
                        for="locale-filter"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Locale</label
                    >
                    <select
                        id="locale-filter"
                        bind:value={filterLocale}
                        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="all">All locales</option>
                        {#each availableLocales as locale}
                            <option value={locale}>{locale}</option>
                        {/each}
                    </select>
                </div>
            {/if}

            <button
                onclick={search}
                disabled={searchLoading || typesLoading || !selectedType}
                class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
                {#if searchLoading}
                    <LoadingSpinner size="sm" />
                    {verifyingTotal > 0
                        ? `Indexing ${verifyingIndex} of ${verifyingTotal}...`
                        : 'Fetching pages...'}
                {:else}
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                        ></path>
                    </svg>
                    Search
                {/if}
            </button>

            {#if cacheBuilt}
                <button
                    onclick={clearCache}
                    disabled={searchLoading}
                    title="Clear cached index and re-scan on next search"
                    class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        ></path>
                    </svg>
                    Refresh index
                </button>
            {/if}
        </div>

        {#if cacheBuilt && !searchLoading}
            <p class="mt-2 text-xs text-gray-400">
                Index cached — subsequent searches are instant. Click "Refresh
                index" to re-scan.
            </p>
        {/if}
    </div>

    <!-- Results -->
    {#if hasSearched}
        <div
            class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-base font-semibold text-gray-900">
                    {#if searchLoading}
                        {verifyingTotal > 0
                            ? `Building index: page ${verifyingIndex} of ${verifyingTotal}...`
                            : 'Fetching Experience pages...'}
                    {:else}
                        {filteredResults.length} page{filteredResults.length ===
                        1
                            ? ''
                            : 's'}
                        {filterLocale !== 'all' ? `in ${filterLocale}` : ''}
                        using
                        <span class="font-mono text-blue-700"
                            >{componentTypes.find((t) => t.key === selectedType)
                                ?.displayName ?? selectedType}</span
                        >
                    {/if}
                </h2>
            </div>

            {#if searchLoading}
                <div
                    class="flex flex-col justify-center items-center py-16 gap-3 text-gray-500 text-sm"
                >
                    <LoadingSpinner size="lg" color="text-blue-600" />
                    {#if verifyingTotal > 0}
                        <div class="w-48 bg-gray-200 rounded-full h-1.5">
                            <div
                                class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style="width: {Math.round(
                                    (verifyingIndex / verifyingTotal) * 100
                                )}%"
                            ></div>
                        </div>
                    {/if}
                </div>
            {:else if filteredResults.length === 0}
                <div class="py-16 text-center text-gray-500">
                    <svg
                        class="w-12 h-12 mx-auto mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                    </svg>
                    No Experience pages found using
                    <strong
                        >{componentTypes.find((t) => t.key === selectedType)
                            ?.displayName ?? selectedType}</strong
                    >
                    {filterLocale !== 'all'
                        ? ` in locale "${filterLocale}"`
                        : ''}.
                </div>
            {:else}
                <table class="w-full text-sm">
                    <thead
                        class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider"
                    >
                        <tr>
                            <th class="px-6 py-3 text-left font-medium">Page</th
                            >
                            <th class="px-6 py-3 text-left font-medium">URL</th>
                            <th class="px-6 py-3 text-left font-medium"
                                >Locale</th
                            >
                            <th class="px-6 py-3 text-right font-medium"
                                >Count</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        {#each filteredResults as page}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-3 font-medium text-gray-900">
                                    {#if page.fullUrl}
                                        <a
                                            href={page.fullUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-blue-600 hover:underline"
                                        >
                                            {page.title}
                                        </a>
                                    {:else}
                                        {page.title}
                                    {/if}
                                </td>
                                <td
                                    class="px-6 py-3 text-gray-500 font-mono text-xs"
                                    >{page.fullUrl || '—'}</td
                                >
                                <td class="px-6 py-3 text-gray-500"
                                    >{page.locale || '—'}</td
                                >
                                <td class="px-6 py-3 text-right">
                                    <span
                                        class="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                                    >
                                        {page.count}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {/if}
</div>
