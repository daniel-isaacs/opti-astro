import type { APIRoute } from 'astro';
import type { ProvidersWhereInput } from '../../../__generated/sdk';
import { getOptimizelySdk } from '../../graphql/getSdk';
import type { ContentPayload } from '../../graphql/shared/ContentPayload';

export const GET: APIRoute = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '0'); // 0 = return all
		const specialty = url.searchParams.get('specialty') || null;
		const location = url.searchParams.get('location') || null;
		const language = url.searchParams.get('language') || null;
		const insurance = url.searchParams.get('insurance') || null;
		const acceptingOnly = url.searchParams.get('acceptingOnly') || null;

		// Build where clause — pipe-delimited fields use like with wildcards
		const where: ProvidersWhereInput = {};
		if (specialty) where.specialties = { like: `%${specialty}%` };
		if (location) where.practice_locations = { like: `%${location}%` };
		if (language) where.languages_spoken = { like: `%${language}%` };
		if (insurance) where.insurance_accepted = { like: `%${insurance}%` };
		if (acceptingOnly === 'true') where.accepting_new_patients = { eq: true };

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

		const firstPage = await sdk.getProviders({
			limit: Math.min(PAGE_SIZE, limit || PAGE_SIZE),
			where: whereInput,
		});
		const total = firstPage?.Providers?.total || 0;
		allItems.push(...(firstPage?.Providers?.items || []));

		const target = limit || total;
		if (target > allItems.length && total > allItems.length) {
			const remaining = Math.ceil((Math.min(target, total) - allItems.length) / PAGE_SIZE);
			const pages = await Promise.all(
				Array.from({ length: remaining }, (_, i) =>
					sdk.getProviders({
						limit: PAGE_SIZE,
						skip: (i + 1) * PAGE_SIZE,
						where: whereInput,
					})
				)
			);
			for (const page of pages) {
				allItems.push(...(page?.Providers?.items || []));
			}
		}

		const items = limit ? allItems.slice(0, limit) : allItems;

		return new Response(
			JSON.stringify({ items, total }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=60, s-maxage=60',
				},
			}
		);
	} catch (error) {
		console.error('Providers API error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch providers',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
