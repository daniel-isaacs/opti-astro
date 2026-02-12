import type { APIRoute } from 'astro';
import type { ApartmentsWhereInput } from '../../../__generated/sdk';
import { getOptimizelySdk } from '../../graphql/getSdk';
import type { ContentPayload } from '../../graphql/shared/ContentPayload';

export const GET: APIRoute = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '10');
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
		const result = await sdk.getApartments({
			limit,
			where: Object.keys(where).length > 0 ? where : undefined,
		});

		const items = result?.Apartments?.items || [];
		const total = result?.Apartments?.total || 0;
		const facets = {
			cities: (result?.Apartments?.facets?.apartment_city || []).filter((f) => f?.name),
			states: (result?.Apartments?.facets?.apartment_state || []).filter((f) => f?.name),
			communities: (result?.Apartments?.facets?.apartment_community_name || []).filter((f) => f?.name),
			parkingTypes: (result?.Apartments?.facets?.apartment_parking_type || []).filter((f) => f?.name),
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
