import type { APIRoute } from 'astro';
import { getOptimizelySdk } from '../../graphql/getSdk';
import type { ContentPayload } from '../../graphql/shared/ContentPayload';

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

export const GET: APIRoute = async () => {
	try {
		const contentPayload: ContentPayload = {
			ctx: 'view',
			key: '',
			ver: '',
			loc: 'en' as any,
			preview_token: '',
			types: [],
		};

		const sdk = getOptimizelySdk(contentPayload);

		// Fetch all apartments in batches of 100 (Graph max limit)
		const PAGE_SIZE = 100;
		const allItems: any[] = [];

		const firstPage = await sdk.getApartments({ limit: PAGE_SIZE, skip: 0 });
		const total = firstPage?.Apartments?.total || 0;
		allItems.push(...(firstPage?.Apartments?.items || []));

		if (total > PAGE_SIZE) {
			const remaining = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
			const pages = await Promise.all(
				Array.from({ length: remaining }, (_, i) =>
					sdk.getApartments({ limit: PAGE_SIZE, skip: (i + 1) * PAGE_SIZE })
				)
			);
			for (const page of pages) {
				allItems.push(...(page?.Apartments?.items || []));
			}
		}

		const items = allItems;

		// Build state → city → community tree from actual data
		const stateMap = new Map<string, Map<string, Map<string, number>>>();

		for (const apt of items) {
			const state = apt?.apartment_state;
			const city = apt?.apartment_city;
			const community = apt?.apartment_community_name;
			if (!state || !city || !community) continue;

			if (!stateMap.has(state)) stateMap.set(state, new Map());
			const cityMap = stateMap.get(state)!;

			if (!cityMap.has(city)) cityMap.set(city, new Map());
			const communityMap = cityMap.get(city)!;

			communityMap.set(community, (communityMap.get(community) || 0) + 1);
		}

		// Convert to sorted array structure
		const locations: StateInfo[] = Array.from(stateMap.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([stateName, cityMap]) => ({
				name: stateName,
				cities: Array.from(cityMap.entries())
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([cityName, communityMap]) => ({
						name: cityName,
						communities: Array.from(communityMap.entries())
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([communityName, count]) => ({
								name: communityName,
								count,
							})),
					})),
			}));

		return new Response(
			JSON.stringify({ locations }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=300, s-maxage=300',
				},
			}
		);
	} catch (error) {
		console.error('Apartment locations API error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch apartment locations',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
