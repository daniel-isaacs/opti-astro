<script lang="ts">
    import { onMount } from 'svelte';

    interface CommunityInfo {
        name: string;
        count: number;
    }

    interface CityInfo {
        name: string;
        communities: CommunityInfo[];
    }

    interface StateInfo {
        name: string;
        cities: CityInfo[];
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
        initialLocations: StateInfo[];
    }

    let { initialLocations }: Props = $props();

    // State for expanded sections
    let expandedStates = $state<Set<string>>(new Set());
    let expandedCities = $state<Set<string>>(new Set());

    // Modal state
    let modalOpen = $state(false);
    let modalCommunity = $state('');
    let modalApartments = $state<Apartment[]>([]);
    let modalLoading = $state(false);

    function toggleState(stateName: string) {
        const next = new Set(expandedStates);
        if (next.has(stateName)) {
            next.delete(stateName);
        } else {
            next.add(stateName);
        }
        expandedStates = next;
    }

    function toggleCity(cityKey: string) {
        const next = new Set(expandedCities);
        if (next.has(cityKey)) {
            next.delete(cityKey);
        } else {
            next.add(cityKey);
        }
        expandedCities = next;
    }

    async function openCommunityModal(communityName: string) {
        modalCommunity = communityName;
        modalApartments = [];
        modalLoading = true;
        modalOpen = true;

        try {
            const params = new URLSearchParams({
                limit: '100',
                community: communityName,
            });
            const response = await fetch(`/api/apartments.json?${params.toString()}`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            modalApartments = data.items || [];
        } catch (error) {
            console.error('Error fetching community apartments:', error);
        } finally {
            modalLoading = false;
        }
    }

    function closeModal() {
        modalOpen = false;
        modalCommunity = '';
        modalApartments = [];
    }

    // Close modal on Escape key
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape' && modalOpen) closeModal();
    }

    // Count total cities for a state
    function cityCount(state: StateInfo): number {
        return state.cities.length;
    }

    // Count total apartments for a state
    function apartmentCount(state: StateInfo): number {
        return state.cities.reduce(
            (sum, city) => sum + city.communities.reduce((s, c) => s + c.count, 0),
            0
        );
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="apartment-browser">
    <!-- State grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each initialLocations as state}
            <div class="card bg-base-200 shadow-sm transition-all" class:ring-2={expandedStates.has(state.name)} class:ring-primary={expandedStates.has(state.name)}>
                <button
                    class="card-body p-4 cursor-pointer text-left w-full"
                    onclick={() => toggleState(state.name)}
                >
                    <div class="flex items-center justify-between">
                        <h3 class="card-title text-xl">{state.name}</h3>
                        <span class="text-base-content/40 text-xl transition-transform" class:rotate-180={expandedStates.has(state.name)}>
                            &#9662;
                        </span>
                    </div>
                    <p class="text-base text-base-content/60">
                        {cityCount(state)} {cityCount(state) === 1 ? 'city' : 'cities'} &middot; {apartmentCount(state)} {apartmentCount(state) === 1 ? 'apartment' : 'apartments'}
                    </p>
                </button>

                {#if expandedStates.has(state.name)}
                    <div class="px-4 pb-4 pt-0">
                        <div class="divider mt-0 mb-2"></div>
                        <ul class="list-none space-y-1">
                            {#each state.cities as city}
                                {@const cityKey = `${state.name}::${city.name}`}
                                <li>
                                    <button
                                        class="btn btn-ghost btn-md justify-between w-full font-normal"
                                        onclick={() => toggleCity(cityKey)}
                                    >
                                        <span>{city.name}</span>
                                        <span class="badge badge-ghost badge-sm">{city.communities.length}</span>
                                    </button>

                                    {#if expandedCities.has(cityKey)}
                                        <ul class="list-none ml-4 mt-1 mb-2 space-y-0.5">
                                            {#each city.communities as community}
                                                <li>
                                                    <button
                                                        class="btn btn-ghost btn-sm justify-between w-full font-normal text-left"
                                                        onclick={() => openCommunityModal(community.name)}
                                                    >
                                                        <span class="truncate">{community.name}</span>
                                                        <span class="badge badge-primary badge-xs">{community.count}</span>
                                                    </button>
                                                </li>
                                            {/each}
                                        </ul>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    {#if initialLocations.length === 0}
        <p class="text-center opacity-50 py-8">No apartment locations found.</p>
    {/if}
</div>

<!-- Modal -->
{#if modalOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal modal-open" onclick={closeModal} onkeydown={() => {}}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-box max-w-4xl max-h-[80vh]" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={closeModal}>&#10005;</button>

            <h3 class="font-bold text-xl mb-4">{modalCommunity}</h3>

            {#if modalLoading}
                <div class="flex justify-center py-12">
                    <span class="loading loading-spinner loading-lg"></span>
                </div>
            {:else if modalApartments.length === 0}
                <p class="text-center opacity-50 py-8">No apartments found for this community.</p>
            {:else}
                <p class="text-sm text-base-content/60 mb-4">
                    {modalApartments.length} apartment{modalApartments.length !== 1 ? 's' : ''} available
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
                    {#each modalApartments as apt}
                        <div class="card bg-base-200 shadow-sm">
                            <div class="card-body p-4 gap-2">
                                <h4 class="card-title text-base">{apt.apartment_display_name}</h4>

                                {#if apt.apartment_unit}
                                    <p class="text-sm text-base-content/70">Unit {apt.apartment_unit}</p>
                                {/if}

                                <div class="flex flex-wrap gap-x-3 text-sm text-base-content/80">
                                    {#if apt.apartment_beds != null}<span>{apt.apartment_beds} bed</span>{/if}
                                    {#if apt.apartment_beds != null && apt.apartment_baths != null}<span class="text-base-content/30">&middot;</span>{/if}
                                    {#if apt.apartment_baths != null}<span>{apt.apartment_baths} bath</span>{/if}
                                    {#if (apt.apartment_beds != null || apt.apartment_baths != null) && apt.apartment_footage != null}<span class="text-base-content/30">&middot;</span>{/if}
                                    {#if apt.apartment_footage != null}<span>{apt.apartment_footage.toLocaleString()} sqft</span>{/if}
                                </div>

                                {#if apt.apartment_rent_base != null}
                                    <p class="text-xl font-bold text-primary">
                                        ${apt.apartment_rent_base.toLocaleString()}<span class="text-sm font-normal text-base-content/50">/mo</span>
                                    </p>
                                {/if}

                                {#if apt.apartment_parking_type || apt.apartment_rent_pet != null}
                                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/60 pt-1 border-t border-base-300">
                                        {#if apt.apartment_parking_type}
                                            <span>&#x1F697; {apt.apartment_parking_type}{#if apt.apartment_parking_price != null} &middot; ${apt.apartment_parking_price}/mo{/if}</span>
                                        {/if}
                                        {#if apt.apartment_rent_pet != null}
                                            <span>&#x1F436; Pet rent ${apt.apartment_rent_pet}/mo</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{/if}
