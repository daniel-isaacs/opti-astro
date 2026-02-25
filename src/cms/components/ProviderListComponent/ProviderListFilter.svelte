<script lang="ts">
    type Provider = {
        provider_id?: number | null;
        slug?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        specialties?: string | null;
        practice_locations?: string | null;
        accepting_new_patients?: boolean | null;
        next_available_appointment?: string | null;
        languages_spoken?: string | null;
        insurance_accepted?: string | null;
    };

    const SPECIALTIES = [
        'Cardiology', 'Dermatology', 'Endocrinology', 'Family Medicine',
        'Gastroenterology', 'General Surgery', 'Neurology', 'OB/GYN',
        'Oncology', 'Orthopedic Surgery', 'Pediatrics', 'Primary Care',
        'Pulmonology', 'Sports Medicine', 'Urology',
    ];

    const LOCATIONS = [
        'Boca Raton, FL', 'Coral Gables, FL', 'Coral Springs, FL',
        'Doral, FL', 'Fort Lauderdale, FL', 'Hialeah, FL', 'Homestead, FL',
        'Kendall, FL', 'Miami Lakes, FL', 'Miami, FL', 'Plantation, FL',
        'West Palm Beach, FL', 'Weston, FL',
    ];

    const LANGUAGES = [
        'Arabic', 'Creole', 'English', 'German', 'Hindi',
        'Korean', 'Mandarin', 'Spanish', 'Urdu',
    ];

    const INSURANCE = [
        'Aetna', 'Blue Cross', 'Cigna', 'UnitedHealthcare',
    ];

    interface Props {
        limit: number;
        initialItems: Provider[];
        initialTotal: number;
    }

    const { limit, initialItems, initialTotal }: Props = $props();

    let items = $state<Provider[]>(initialItems);
    let total = $state(initialTotal);
    let isLoading = $state(false);

    let selectedSpecialty = $state('');
    let selectedLocation = $state('');
    let selectedLanguage = $state('');
    let selectedInsurance = $state('');
    let acceptingOnly = $state(false);

    let hasActiveFilters = $derived(
        selectedSpecialty !== '' || selectedLocation !== '' ||
        selectedLanguage !== '' || selectedInsurance !== '' || acceptingOnly
    );

    function splitPipe(value: string | null | undefined): string[] {
        if (!value) return [];
        return value.split(' | ').map(s => s.trim()).filter(Boolean);
    }

    function formatDate(value: string | null | undefined): string {
        if (!value) return '';
        const ts = parseInt(value);
        const date = isNaN(ts) ? new Date(value) : new Date(ts * 1000);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function clearFilters() {
        selectedSpecialty = '';
        selectedLocation = '';
        selectedLanguage = '';
        selectedInsurance = '';
        acceptingOnly = false;
    }

    async function fetchProviders() {
        isLoading = true;
        try {
            const params = new URLSearchParams();
            if (limit) params.append('limit', limit.toString());
            if (selectedSpecialty) params.append('specialty', selectedSpecialty);
            if (selectedLocation) params.append('location', selectedLocation);
            if (selectedLanguage) params.append('language', selectedLanguage);
            if (selectedInsurance) params.append('insurance', selectedInsurance);
            if (acceptingOnly) params.append('acceptingOnly', 'true');

            const response = await fetch(`/api/providers.json?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch providers');
            const data = await response.json();
            items = data.items || [];
            total = data.total || 0;
        } catch (err) {
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    $effect(() => {
        // track all filter state
        selectedSpecialty; selectedLocation; selectedLanguage;
        selectedInsurance; acceptingOnly;
        fetchProviders();
    });
</script>

<div class="flex flex-col gap-6">
    <!-- Filters -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <select class="select select-bordered select-sm w-full" bind:value={selectedSpecialty}>
            <option value="">All Specialties</option>
            {#each SPECIALTIES as s}
                <option value={s}>{s}</option>
            {/each}
        </select>

        <select class="select select-bordered select-sm w-full" bind:value={selectedLocation}>
            <option value="">All Locations</option>
            {#each LOCATIONS as l}
                <option value={l}>{l}</option>
            {/each}
        </select>

        <select class="select select-bordered select-sm w-full" bind:value={selectedLanguage}>
            <option value="">All Languages</option>
            {#each LANGUAGES as l}
                <option value={l}>{l}</option>
            {/each}
        </select>

        <select class="select select-bordered select-sm w-full" bind:value={selectedInsurance}>
            <option value="">All Insurance</option>
            {#each INSURANCE as i}
                <option value={i}>{i}</option>
            {/each}
        </select>
    </div>

    <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" class="toggle toggle-success toggle-sm" bind:checked={acceptingOnly} />
            <span class="text-sm">Accepting New Patients</span>
        </label>

        {#if hasActiveFilters}
            <button class="btn btn-ghost btn-sm" onclick={clearFilters}>
                Clear filters
            </button>
        {/if}
    </div>

    <!-- Count -->
    <p class="text-sm text-base-content/60">
        {#if isLoading}
            Loading...
        {:else}
            Showing {items.length} of {total} provider{total !== 1 ? 's' : ''}
        {/if}
    </p>

    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each items as provider}
            {@const specialties = splitPipe(provider.specialties)}
            {@const locations = splitPipe(provider.practice_locations)}
            {@const languages = splitPipe(provider.languages_spoken)}
            {@const insurance = splitPipe(provider.insurance_accepted)}
            <div class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                <div class="card-body p-4 gap-3">
                    <!-- Accepting status -->
                    <div>
                        {#if provider.accepting_new_patients}
                            <span class="badge badge-success badge-sm text-white">Accepting New Patients</span>
                        {:else}
                            <span class="badge badge-ghost badge-sm">Not Accepting New Patients</span>
                        {/if}
                    </div>

                    <!-- Name -->
                    <h3 class="text-lg font-bold leading-tight">
                        {provider.first_name} {provider.last_name}
                    </h3>

                    <!-- Specialties -->
                    {#if specialties.length > 0}
                        <div class="flex flex-wrap gap-1">
                            {#each specialties as s}
                                <span class="badge badge-outline badge-sm">{s}</span>
                            {/each}
                        </div>
                    {/if}

                    <div class="divider my-0"></div>

                    <!-- Location -->
                    {#if locations.length > 0}
                        <p class="text-sm text-base-content/70">
                            📍 {locations.join(' · ')}
                        </p>
                    {/if}

                    <!-- Next available -->
                    {#if provider.next_available_appointment}
                        <p class="text-sm text-base-content/70">
                            📅 Next available: {formatDate(provider.next_available_appointment)}
                        </p>
                    {/if}

                    <!-- Languages & Insurance -->
                    <div class="flex flex-col gap-1 mt-auto pt-1">
                        {#if languages.length > 0}
                            <p class="text-xs text-base-content/50">
                                Languages: {languages.join(', ')}
                            </p>
                        {/if}
                        {#if insurance.length > 0}
                            <p class="text-xs text-base-content/50">
                                Insurance: {insurance.join(', ')}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    {#if !isLoading && items.length === 0}
        <p class="text-center text-base-content/50 py-12">No providers found matching your filters.</p>
    {/if}
</div>
