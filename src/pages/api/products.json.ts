import type { APIRoute } from 'astro';
import type { ProductWhereInput } from '../../../__generated/sdk';
import { getOptimizelySdk } from '../../graphql/getSdk';
import type { ContentPayload } from '../../graphql/shared/ContentPayload';

export const GET: APIRoute = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '0'); // 0 = return all
		const brand = url.searchParams.get('brand') || null;
		const category = url.searchParams.get('category') || null;
		const subcategory = url.searchParams.get('subcategory') || null;
		const maxPrice = url.searchParams.get('maxPrice') || null;
		const minPrice = url.searchParams.get('minPrice') || null;
		const onSale = url.searchParams.get('onSale') || null;
		const includeInactive = url.searchParams.get('includeInactive') || null;

		// Build where clause from filters
		const where: ProductWhereInput = {};
		if (brand) where.brand = { eq: brand };
		if (category) where.category = { eq: category };
		if (subcategory) where.subcategory = { eq: subcategory };

		// Price range filter
		if (minPrice || maxPrice) {
			where.price = {};
			if (minPrice) where.price.gte = parseFloat(minPrice);
			if (maxPrice) where.price.lte = parseFloat(maxPrice);
		}

		// On sale filter: sale_price > 0
		if (onSale === 'true') {
			where.sale_price = { gt: 0 };
		}

		// By default, only show active products
		if (includeInactive !== 'true') {
			where.is_active = { eq: true };
		}

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

		const firstPage = await sdk.getProducts({
			limit: Math.min(PAGE_SIZE, limit || PAGE_SIZE),
			where: whereInput,
		});
		const total = firstPage?.Product?.total || 0;
		allItems.push(...(firstPage?.Product?.items || []));

		const target = limit || total; // 0 = all
		if (target > allItems.length && total > allItems.length) {
			const remaining = Math.ceil((Math.min(target, total) - allItems.length) / PAGE_SIZE);
			const pages = await Promise.all(
				Array.from({ length: remaining }, (_, i) =>
					sdk.getProducts({
						limit: PAGE_SIZE,
						skip: (i + 1) * PAGE_SIZE,
						where: whereInput,
					})
				)
			);
			for (const page of pages) {
				allItems.push(...(page?.Product?.items || []));
			}
		}

		const items = limit ? allItems.slice(0, limit) : allItems;
		const facets = {
			brands: (firstPage?.Product?.facets?.brand || []).filter((f: any) => f?.name),
			categories: (firstPage?.Product?.facets?.category || []).filter((f: any) => f?.name),
			subcategories: (firstPage?.Product?.facets?.subcategory || []).filter((f: any) => f?.name),
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
		console.error('Products API error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch products',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
