import type { APIRoute } from 'astro';
import type { ApartmentsWhereInput } from '../../../__generated/sdk';
import { getOptimizelySdk } from '../../graphql/getSdk';
import type { ContentPayload } from '../../graphql/shared/ContentPayload';

export const GET: APIRoute = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '0'); // 0 = return all
		const city = url.searchParams.get('city') || null;
		const state = url.searchParams.get('state') || null;
		const community = url.searchParams.get('community') || null;
		const maxRent = url.searchParams.get('maxRent') || null;
		const parkingType = url.searchParams.get('parkingType') || null;

		// Build where clause from filters
		const where: ApartmentsWhereInput = {};
		if (city) where.apartment_city = { eq: city };
		if (state) where.apartment_state = { eq: state };
		if (community) where.apartment_community_name = { eq: community };
		if (maxRent) where.apartment_rent_base = { lte: parseFloat(maxRent) };
		if (parkingType) where.apartment_parking_type = { eq: parkingType };

		const contentPayload: ContentPayload = {
			ctx: 'view',
			key: '',
			ver: '',
			loc: 'en' as any,
			preview_token: '',
			types: [],
		};

		const sdk = getOptimizelySdk(contentPayload);
		const whereInput = Object.keys(where).length > 0 ? where : undefined;

		// Fetch in batches of 100 (Graph max limit)
		const PAGE_SIZE = 100;
		const allItems: any[] = [];

		const firstPage = await sdk.getApartments({
			limit: Math.min(PAGE_SIZE, limit || PAGE_SIZE),
			where: whereInput,
		});
		const total = firstPage?.Apartments?.total || 0;
		allItems.push(...(firstPage?.Apartments?.items || []));

		const target = limit || total; // 0 = all
		if (target > allItems.length && total > allItems.length) {
			const remaining = Math.ceil((Math.min(target, total) - allItems.length) / PAGE_SIZE);
			const pages = await Promise.all(
				Array.from({ length: remaining }, (_, i) =>
					sdk.getApartments({
						limit: PAGE_SIZE,
						skip: (i + 1) * PAGE_SIZE,
						where: whereInput,
					})
				)
			);
			for (const page of pages) {
				allItems.push(...(page?.Apartments?.items || []));
			}
		}

		const items = limit ? allItems.slice(0, limit) : allItems;
		const facets = {
			cities: (firstPage?.Apartments?.facets?.apartment_city || []).filter((f: any) => f?.name),
			states: (firstPage?.Apartments?.facets?.apartment_state || []).filter((f: any) => f?.name),
			communities: (firstPage?.Apartments?.facets?.apartment_community_name || []).filter((f: any) => f?.name),
			parkingTypes: (firstPage?.Apartments?.facets?.apartment_parking_type || []).filter((f: any) => f?.name),
		};

		return new Response(
			JSON.stringify({ items, total, facets }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=60, s-maxage=60',
				},
			}
		);
	} catch (error) {
		console.error('Apartments API error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch apartments',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
