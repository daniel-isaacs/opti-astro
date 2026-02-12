<script lang="ts">
    import { onMount } from 'svelte';

    interface Facet {
        name: string;
        count: number;
    }

    interface Apartment {
        apartment_display_name?: string | null;
        apartment_city?: string | null;
        apartment_state?: string | null;
        apartment_community_name?: string | null;
        apartment_unit?: string | null;
        apartment_beds?: number | null;
        apartment_baths?: number | null;
        apartment_footage?: number | null;
        apartment_rent_base?: number | null;
        apartment_parking_type?: string | null;
        apartment_parking_price?: number | null;
        apartment_rent_pet?: number | null;
    }

    interface Props {
        limit: number;
        initialItems: Apartment[];
        initialTotal: number;
        initialFacets: {
            cities: Facet[];
            states: Facet[];
            communities: Facet[];
            parkingTypes: Facet[];
        };
    }

    let { limit, initialItems, initialTotal, initialFacets }: Props = $props();

    // State
    let items = $state<Apartment[]>(initialItems);
    let total = $state(initialTotal);
    let isLoading = $state(false);

    // Filter state
    let selectedCity = $state('');
    let selectedState = $state('');
    let selectedCommunity = $state('');
    let selectedParkingType = $state('');
    let maxRent = $state('');

    let hasActiveFilters = $derived(
        selectedCity !== '' ||
            selectedState !== '' ||
            selectedCommunity !== '' ||
            selectedParkingType !== '' ||
            maxRent !== ''
    );

    async function fetchApartments() {
        isLoading = true;
        try {
            const params = new URLSearchParams({ limit: limit.toString() });
            if (selectedCity) params.append('city', selectedCity);
            if (selectedState) params.append('state', selectedState);
            if (selectedCommunity)
                params.append('community', selectedCommunity);
            if (selectedParkingType)
                params.append('parkingType', selectedParkingType);
            if (maxRent) params.append('maxRent', maxRent);

            const response = await fetch(
                `/api/apartments.json?${params.toString()}`
            );
            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            items = data.items || [];
            total = data.total || 0;
        } catch (error) {
            console.error('Error fetching apartments:', error);
        } finally {
            isLoading = false;
        }
    }

    function handleFilterChange() {
        fetchApartments();
    }

    function clearFilters() {
        selectedCity = '';
        selectedState = '';
        selectedCommunity = '';
        selectedParkingType = '';
        maxRent = '';
        fetchApartments();
    }

    let rentTimeout: number | null = null;
    function handleRentInput(event: Event) {
        const target = event.target as HTMLInputElement;
        maxRent = target.value;
        if (rentTimeout) clearTimeout(rentTimeout);
        rentTimeout = window.setTimeout(() => {
            fetchApartments();
        }, 500);
    }
</script>

<div class="apartment-list-filter">
    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6 items-end">
        <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
            <label class="label" for="filter-state">
                <span class="label-text text-xs font-semibold uppercase"
                    >State</span
                >
            </label>
            <select
                id="filter-state"
                class="select select-bordered select-sm"
                bind:value={selectedState}
                onchange={handleFilterChange}
            >
                <option value="">All states</option>
                {#each initialFacets.states as facet}
                    <option value={facet.name}
                        >{facet.name} ({facet.count})</option
                    >
                {/each}
            </select>
        </div>

        <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
            <label class="label" for="filter-city">
                <span class="label-text text-xs font-semibold uppercase"
                    >City</span
                >
            </label>
            <select
                id="filter-city"
                class="select select-bordered select-sm"
                bind:value={selectedCity}
                onchange={handleFilterChange}
            >
                <option value="">All cities</option>
                {#each initialFacets.cities as facet}
                    <option value={facet.name}
                        >{facet.name} ({facet.count})</option
                    >
                {/each}
            </select>
        </div>

        <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
            <label class="label" for="filter-community">
                <span class="label-text text-xs font-semibold uppercase"
                    >Community</span
                >
            </label>
            <select
                id="filter-community"
                class="select select-bordered select-sm"
                bind:value={selectedCommunity}
                onchange={handleFilterChange}
            >
                <option value="">All communities</option>
                {#each initialFacets.communities as facet}
                    <option value={facet.name}
                        >{facet.name} ({facet.count})</option
                    >
                {/each}
            </select>
        </div>

        <div class="form-control w-full sm:w-auto sm:min-w-[160px]">
            <label class="label" for="filter-parking">
                <span class="label-text text-xs font-semibold uppercase"
                    >Parking</span
                >
            </label>
            <select
                id="filter-parking"
                class="select select-bordered select-sm"
                bind:value={selectedParkingType}
                onchange={handleFilterChange}
            >
                <option value="">All parking</option>
                {#each initialFacets.parkingTypes as facet}
                    <option value={facet.name}
                        >{facet.name} ({facet.count})</option
                    >
                {/each}
            </select>
        </div>

        <div class="form-control w-full sm:w-auto sm:min-w-[140px]">
            <label class="label" for="filter-rent">
                <span class="label-text text-xs font-semibold uppercase"
                    >Max Rent</span
                >
            </label>
            <input
                id="filter-rent"
                type="number"
                class="input input-bordered input-sm"
                placeholder="$ max"
                value={maxRent}
                oninput={handleRentInput}
                min="0"
                step="100"
            />
        </div>

        {#if hasActiveFilters}
            <button class="btn btn-ghost btn-sm" onclick={clearFilters}>
                Clear filters
            </button>
        {/if}
    </div>

    <!-- Results count -->
    <p class="text-sm opacity-60 mb-4">
        {#if isLoading}
            Loading...
        {:else}
            {total} apartment{total !== 1 ? 's' : ''} found
        {/if}
    </p>

    <!-- Results grid -->
    <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        class:opacity-50={isLoading}
    >
        {#each items as apt}
            <div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
                <div class="card-body gap-3">
                    <div>
                        <h2 class="card-title text-lg">{apt.apartment_display_name}</h2>
                        <p class="text-sm text-base-content/60">
                            {[apt.apartment_community_name, apt.apartment_city, apt.apartment_state]
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                    </div>

                    {#if apt.apartment_unit}
                        <p class="text-sm text-base-content/70">Unit {apt.apartment_unit}</p>
                    {/if}

                    <div class="flex flex-wrap gap-x-3 text-sm text-base-content/80">
                        {#if apt.apartment_beds != null}<span>{apt.apartment_beds} bed</span>{/if}
                        {#if apt.apartment_beds != null && apt.apartment_baths != null}<span class="text-base-content/30">·</span>{/if}
                        {#if apt.apartment_baths != null}<span>{apt.apartment_baths} bath</span>{/if}
                        {#if (apt.apartment_beds != null || apt.apartment_baths != null) && apt.apartment_footage != null}<span class="text-base-content/30">·</span>{/if}
                        {#if apt.apartment_footage != null}<span>{apt.apartment_footage.toLocaleString()} sqft</span>{/if}
                    </div>

                    {#if apt.apartment_rent_base != null}
                        <p class="text-xl font-bold text-primary">${apt.apartment_rent_base.toLocaleString()}<span class="text-sm font-normal text-base-content/50">/mo</span></p>
                    {/if}

                    {#if apt.apartment_parking_type || apt.apartment_rent_pet != null}
                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/60 pt-1 border-t border-base-200">
                            {#if apt.apartment_parking_type}
                                <span>🚗 {apt.apartment_parking_type}{#if apt.apartment_parking_price != null} · ${apt.apartment_parking_price}/mo{/if}</span>
                            {/if}
                            {#if apt.apartment_rent_pet != null}
                                <span>🐶 Pet rent ${apt.apartment_rent_pet}/mo</span>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    {#if !isLoading && items.length === 0}
        <p class="text-center opacity-50 py-8">
            No apartments found matching your filters.
        </p>
    {/if}
</div>
