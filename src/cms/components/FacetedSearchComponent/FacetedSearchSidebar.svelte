<script lang="ts">
	import { getArticleTypeLabel, getArticleCategoryLabel } from './lib/facetedSearchHelpers';

	interface Facet {
		name: string;
		count: number;
	}

	interface Props {
		facets: {
			authors: Facet[];
			types: Facet[];
			articleTypes?: Facet[];
			articleCategories?: Facet[];
		};
		selectedAuthors: string[];
		selectedTypes: string[];
		selectedArticleTypes?: string[];
		selectedArticleCategories?: string[];
		searchTerm: string;
		activeFilterCount: number;
		showAuthorFacet: boolean;
		showTypeFacet: boolean;
		isEditMode?: boolean;
		onClearAll: () => void;
		onRemoveFilter: (type: 'author' | 'type' | 'articleType' | 'articleCategory' | 'search', value?: string) => void;
		onToggleFacet: (type: 'author' | 'type' | 'articleType' | 'articleCategory', value: string) => void;
	}

	let {
		facets,
		selectedAuthors,
		selectedTypes,
		selectedArticleTypes = [],
		selectedArticleCategories = [],
		searchTerm,
		activeFilterCount,
		showAuthorFacet,
		showTypeFacet,
		isEditMode = false,
		onClearAll,
		onRemoveFilter,
		onToggleFacet
	}: Props = $props();

	let expandedFacets = $state({
		authors: true,
		types: true,
		articleTypes: true,
		articleCategories: true
	});

	function toggleFacetExpansion(facetName: 'authors' | 'types' | 'articleTypes' | 'articleCategories') {
		expandedFacets[facetName] = !expandedFacets[facetName];
	}
</script>

<aside class="lg:col-span-1">
	<div class="sticky top-4">
		<div class="bg-base-100 rounded-lg shadow-md p-4">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-lg">Filters</h3>
				{#if activeFilterCount > 0}
					<button
						class="btn btn-sm btn-ghost"
						onclick={onClearAll}
						disabled={isEditMode}
					>
						Clear all
					</button>
				{/if}
			</div>

			<!-- Active Filters -->
			{#if activeFilterCount > 0}
				<div class="mb-4 pb-4 border-b border-base-300">
					<p class="text-sm text-base-content/70 mb-2">
						Active filters ({activeFilterCount})
					</p>
					<div class="flex flex-wrap gap-2">
						{#if searchTerm}
							<button
								class="badge badge-primary gap-2"
								onclick={() => onRemoveFilter('search')}
								disabled={isEditMode}
							>
								{searchTerm}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
						{#each selectedAuthors as author}
							<button
								class="badge badge-secondary gap-2"
								onclick={() => onRemoveFilter('author', author)}
								disabled={isEditMode}
							>
								{author}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/each}
						{#each selectedTypes as type}
							<button
								class="badge badge-accent gap-2"
								onclick={() => onRemoveFilter('type', type)}
								disabled={isEditMode}
							>
								{type}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/each}
						{#each selectedArticleTypes as articleType}
							<button
								class="badge badge-info gap-2"
								onclick={() => onRemoveFilter('articleType', articleType)}
								disabled={isEditMode}
							>
								{getArticleTypeLabel(articleType)}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/each}
						{#each selectedArticleCategories as articleCategory}
							<button
								class="badge badge-warning gap-2"
								onclick={() => onRemoveFilter('articleCategory', articleCategory)}
								disabled={isEditMode}
							>
								{getArticleCategoryLabel(articleCategory)}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Author Facet -->
			{#if showAuthorFacet && facets.authors.length > 0}
				<div class="mb-4">
					<button
						class="flex items-center justify-between w-full text-left font-medium mb-2"
						onclick={() => toggleFacetExpansion('authors')}
					>
						<span>Author</span>
						<svg
							class="w-4 h-4 transition-transform"
							class:rotate-180={!expandedFacets.authors}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if expandedFacets.authors}
						<div class="space-y-2">
							{#each facets.authors as author}
								<label class="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										checked={selectedAuthors.includes(author.name)}
										onchange={() => onToggleFacet('author', author.name)}
										disabled={isEditMode}
									/>
									<span class="flex-1 text-sm">{author.name}</span>
									<span class="text-xs text-base-content/50">({author.count})</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Article Type Facet -->
			{#if facets.articleTypes && facets.articleTypes.length > 0}
				<div class="mb-4">
					<button
						class="flex items-center justify-between w-full text-left font-medium mb-2"
						onclick={() => toggleFacetExpansion('articleTypes')}
					>
						<span>Article Type</span>
						<svg
							class="w-4 h-4 transition-transform"
							class:rotate-180={!expandedFacets.articleTypes}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if expandedFacets.articleTypes}
						<div class="space-y-2">
							{#each facets.articleTypes as articleType}
								<label class="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										checked={selectedArticleTypes.includes(articleType.name)}
										onchange={() => onToggleFacet('articleType', articleType.name)}
										disabled={isEditMode}
									/>
									<span class="flex-1 text-sm">{getArticleTypeLabel(articleType.name)}</span>
									<span class="text-xs text-base-content/50">({articleType.count})</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Article Category Facet -->
			{#if facets.articleCategories && facets.articleCategories.length > 0}
				<div class="mb-4">
					<button
						class="flex items-center justify-between w-full text-left font-medium mb-2"
						onclick={() => toggleFacetExpansion('articleCategories')}
					>
						<span>Article Category</span>
						<svg
							class="w-4 h-4 transition-transform"
							class:rotate-180={!expandedFacets.articleCategories}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if expandedFacets.articleCategories}
						<div class="space-y-2">
							{#each facets.articleCategories as articleCategory}
								<label class="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										checked={selectedArticleCategories.includes(articleCategory.name)}
										onchange={() => onToggleFacet('articleCategory', articleCategory.name)}
										disabled={isEditMode}
									/>
									<span class="flex-1 text-sm">{getArticleCategoryLabel(articleCategory.name)}</span>
									<span class="text-xs text-base-content/50">({articleCategory.count})</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Content Type Facet -->
			{#if showTypeFacet && facets.types.length > 0}
				<div class="mb-4">
					<button
						class="flex items-center justify-between w-full text-left font-medium mb-2"
						onclick={() => toggleFacetExpansion('types')}
					>
						<span>Content Type</span>
						<svg
							class="w-4 h-4 transition-transform"
							class:rotate-180={!expandedFacets.types}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if expandedFacets.types}
						<div class="space-y-2">
							{#each facets.types as type}
								<label class="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										checked={selectedTypes.includes(type.name)}
										onchange={() => onToggleFacet('type', type.name)}
										disabled={isEditMode}
									/>
									<span class="flex-1 text-sm">{type.name}</span>
									<span class="text-xs text-base-content/50">({type.count})</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</aside>
