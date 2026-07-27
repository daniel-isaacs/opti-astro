import { getOptimizelySdk } from '../graphql/getSdk';
import type { ContentPayload } from '../graphql/shared/ContentPayload';
import type { FakeUser } from './fake-auth';

const BATCH_SIZE = 100;

/**
 * Deep-walk a GraphQL response and collect the `_metadata.key` of every
 * embedded content item (content area items, composition components, grid
 * items, ...). Over-collection is harmless: keys that are never rendered
 * through `_Components.astro` are simply never checked.
 */
export function collectContentKeys(node: unknown, keys = new Set<string>()): Set<string> {
    if (Array.isArray(node)) {
        for (const item of node) collectContentKeys(item, keys);
        return keys;
    }
    if (node && typeof node === 'object') {
        const meta = (node as any)._metadata;
        if (meta && typeof meta.key === 'string' && meta.key.length > 0) {
            keys.add(meta.key);
        }
        for (const value of Object.values(node)) collectContentKeys(value, keys);
    }
    return keys;
}

/**
 * Optimizely Graph inlines referenced content (content areas, composition
 * components) into the parent document at INDEX time and does not evaluate
 * per-item read access at query time — ACL/RBAC filtering only applies to
 * documents matched at the TOP LEVEL of a query. So a page/experience query
 * happily returns restricted blocks embedded in the response.
 *
 * This helper re-checks every embedded key with a top-level `_Content(ids:)`
 * query using the same auth context as the page request (single key for
 * anonymous, HMAC + cg-username/cg-roles for a logged-in user). Keys missing
 * from that response are not readable by the current user and must not be
 * rendered.
 *
 * Returns the set of readable keys, or null when enforcement does not apply
 * (edit/preview contexts use editor tokens that already grant full access).
 */
export async function resolveAllowedContentKeys(
    contentPayload: ContentPayload,
    user: FakeUser | null | undefined,
    response: unknown
): Promise<Set<string> | null> {
    if (contentPayload.ctx !== 'view') return null;

    const keys = [...collectContentKeys(response)];
    // The page's own key is in the set too; it was already authorized by the
    // top-level page/experience query, so re-checking it is a no-op.
    const allowed = new Set<string>();
    if (keys.length === 0) return allowed;

    const sdk = getOptimizelySdk(contentPayload, user);
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batch = keys.slice(i, i + BATCH_SIZE);
        const result = await sdk.contentAccess({ keys: batch, limit: BATCH_SIZE });
        for (const item of result?._Content?.items ?? []) {
            const key = item?._metadata?.key;
            if (key) allowed.add(key);
        }
    }
    return allowed;
}
