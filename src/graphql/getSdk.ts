import { print } from 'graphql';
import { GraphQLClient } from 'graphql-request';
import { createHmac, createHash } from 'crypto';
import type { FakeUser } from '../lib/fake-auth';

import {
    getSdk as getSdkWithClient,
    type Requester,
} from '../../__generated/sdk';

import {
    OPTIMIZELY_GRAPH_GATEWAY,
    OPTIMIZELY_GRAPH_SINGLE_KEY,
    OPTIMIZELY_GRAPH_APP_KEY,
    OPTIMIZELY_DEV_MODE,
} from 'astro:env/client';
import { OPTIMIZELY_GRAPH_SECRET, EXTERNAL_PREVIEW_ENABLED } from 'astro:env/server';

import type { ContentPayload } from '../graphql/shared/ContentPayload.ts';

// Global store for GraphQL queries in dev mode
let currentStore: Array<{
    query: string;
    variables: any;
    timestamp: Date;
    response?: any;
}> = [];

// Track the last request timestamp to detect new page loads
let lastRequestTime = 0;
const REQUEST_RESET_THRESHOLD = 500; // 500ms between requests indicates new page

// Function to get captured queries (for use in components)
export function getGraphQLQueries() {
    return currentStore;
}

// Function to clear query history
export function clearGraphQLQueries() {
    currentStore = [];
}

export function getOptimizelySdk(contentPayload: ContentPayload, user?: FakeUser | null) {
    const mode = contentPayload.ctx;
    const prevToken = contentPayload.preview_token;
    const extprevToken = Buffer.from(
        `${OPTIMIZELY_GRAPH_APP_KEY}:${OPTIMIZELY_GRAPH_SECRET}`
    ).toString('base64');

    var client = new GraphQLClient('');
    const requester: Requester<any> = async (doc: any, vars: any) => {
        // HMAC auth path: use native fetch so the body we sign === the body we send
        if (user && mode === 'view') {
            const endpointUrl = `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2`;
            const requestBody = JSON.stringify({ query: print(doc), variables: vars });

            if (OPTIMIZELY_DEV_MODE) {
                const now = Date.now();
                if (now - lastRequestTime > REQUEST_RESET_THRESHOLD) currentStore = [];
                lastRequestTime = now;
                currentStore.push({ query: print(doc), variables: vars, timestamp: new Date(), response: undefined });
            }

            try {
                const authHeader = buildHmacHeader('POST', endpointUrl, requestBody);
                if (import.meta.env.DEV) {
                    console.log('[HMAC] Sending request as:', user.cgUsername, '| roles:', user.cgRoles.join(','));
                    console.log('[HMAC] Auth header:', authHeader);
                }
                const response = await fetch(endpointUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: authHeader,
                        'Content-Type': 'application/json',
                        'cg-username': user.cgUsername,
                        'cg-roles': user.cgRoles.join(','),
                    },
                    body: requestBody,
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HMAC request failed (${response.status}): ${errorText}`);
                }
                const json = await response.json() as any;
                if (OPTIMIZELY_DEV_MODE && currentStore.length > 0) {
                    currentStore[currentStore.length - 1].response = json?.data;
                }
                if (json?.errors?.length) {
                    throw new Error(json.errors.map((e: any) => e.message).join('; '));
                }
                return json?.data;
            } catch (err: any) {
                console.error('[HMAC] GraphQL request error:', err.message ?? err);
                return undefined;
            }
        }

        if (mode === 'edit' && prevToken) {
            client = new GraphQLClient(
                `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2` + `?stored=true`, // enable cached templates
                {
                    headers: {
                        Authorization: `Bearer ${prevToken}`,
                        'Content-Type': 'application/json',
                        'cg-stored-query': 'template',
                    },
                }
            );
        } else if (
            mode === 'ext_preview' &&
            EXTERNAL_PREVIEW_ENABLED &&
            extprevToken
        ) {
            client = new GraphQLClient(
                `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2` + `?stored=true`, // enable cached templates
                {
                    headers: {
                        Authorization: `Basic ${extprevToken}`,
                        'Content-Type': 'application/json',
                        'cg-stored-query': 'template',
                    },
                }
            );
        } else {
            client = new GraphQLClient(
                `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2?auth=${OPTIMIZELY_GRAPH_SINGLE_KEY}`
            );
        }

        // Capture query data in dev mode
        if (OPTIMIZELY_DEV_MODE) {
            const now = Date.now();

            // If enough time has passed since last request, assume it's a new page
            if (now - lastRequestTime > REQUEST_RESET_THRESHOLD) {
                currentStore = [];
            }

            lastRequestTime = now;

            const queryEntry = {
                query: print(doc),
                variables: vars,
                timestamp: new Date(),
                response: undefined as any,
            };

            currentStore.push(queryEntry);
        }

        try {
            const res = await client.rawRequest(print(doc), vars);

            // Update the response in dev mode
            if (OPTIMIZELY_DEV_MODE && currentStore.length > 0) {
                currentStore[currentStore.length - 1].response = res?.data;
            }

            return res?.data as any;
        } catch (err: any) {
            if (import.meta.env.DEV) {
                console.error(
                    'Error in GraphQL request:',
                    '\n' + print(doc) + '\n',
                    vars,
                    '\n' + err.message
                );
            } else {
                console.error(err);
            }
            console.error(
                'Error in GraphQL request:',
                '\n' + print(doc) + '\n',
                vars,
                '\n' + err.message
            );
        }
    };

    return getSdkWithClient(requester);
}

// "epi-hmac {appKey}:{timestamp}:{nonce}:{signature}"
// Signature = HMAC-SHA256([appKey, method, path, timestamp, nonce, md5(body)].join(''), base64decode(secret))
function buildHmacHeader(method: string, url: string, body: string): string {
    const key = OPTIMIZELY_GRAPH_APP_KEY;
    const secretBuf = Buffer.from(OPTIMIZELY_GRAPH_SECRET, 'base64');
    const timestamp = new Date().getTime();
    const nonce = Math.random().toString(36).substring(2, 10);
    const bodyMd5 = createHash('md5').update(body).digest('base64');
    const parsed = new URL(url);
    const uri = parsed.pathname + parsed.search;
    const message = [key, method.toUpperCase(), uri, timestamp, nonce, bodyMd5].join('');
    const sig = createHmac('sha256', secretBuf).update(message).digest('base64');
    return `epi-hmac ${key}:${timestamp}:${nonce}:${sig}`;
}

// export function getOptimizelyPreviewSdk() {
//     const prevToken = Buffer.from(
//         `${OPTIMIZELY_GRAPH_APP_KEY}:${OPTIMIZELY_GRAPH_SECRET}`
//     ).toString('base64');

//     var client = new GraphQLClient('');
//     const requester: Requester<any> = async (doc: any, vars: any) => {
//         if (prevToken) {
//             client = new GraphQLClient(
//                 `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2` + `?stored=true`, // enable cached templates
//                 {
//                     headers: {
//                         Authorization: `Basic ${prevToken}`,
//                         'Content-Type': 'application/json',
//                         'cg-stored-query': 'template',
//                     },
//                 }
//             );
//         } else {
//             client = new GraphQLClient(
//                 `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2?auth=${OPTIMIZELY_GRAPH_SINGLE_KEY}`
//             );
//         }

//         try {
//             const res = await client.rawRequest(print(doc), vars);

//             return res?.data as any;
//         } catch (err: any) {
//             if (import.meta.env.DEV) {
//                 console.error(
//                     'Error in GraphQL request:',
//                     '\n' + print(doc) + '\n',
//                     vars,
//                     '\n' + err.message
//                 );
//             } else {
//                 console.error(err);
//             }
//             console.error(
//                 'Error in GraphQL request:',
//                 '\n' + print(doc) + '\n',
//                 vars,
//                 '\n' + err.message
//             );
//         }
//     };

//     return getSdkWithClient(requester);
// }

// // "epi-hmac {appKey}:{timestamp}:{nonce}:{signature}"

// const contentGraphEndpoint = OPTIMIZELY_GRAPH_GATEWAY;
// const hmacSecret = "preview_secret";

// const hmac: HmacCredentials = {
//     key: '<hmac_key>',
//     secret: '<hmac_secret>',
// };

// export function generateHmac(data: string): string {
//     const key = OPTIMIZELY_GRAPH_APP_KEY;
//     const timestamp = new Date().getTime();
//     const nonce = Math.random().toString(36).substring(7);

//     const secret = Crypto.en
//     return createHmac('sha256', secretKey).update(data).digest('hex');
// }

// export function verifyHmac(data: string, hmac: string): boolean {
//     const generatedHmac = generateHmac(data);
//     return generatedHmac === hmac;
// }

// function getContentGraphHmacAuthHeader(
//     method: string,
//     uri: string,
//     body: string
// ): string {
//     const bodyBase64 = CryptoJS.MD5(body).toString(CryptoJS.enc.Base64);
//     const key = hmac.key;
//     const secret = CryptoJS.enc.Base64.parse(hmac.secret);
//     const timestamp = new Date().getTime();
//     const nonce = Math.random().toString(36).substring(7);
//     const hmacSha = CryptoJS.HmacSHA256(
//         [key, method, uri, timestamp, nonce, bodyBase64].join(''),
//         secret
//     );
//     const base64hmac = CryptoJS.enc.Base64.stringify(hmacSha);
//     return `epi-hmac ${key}:${timestamp}:${nonce}:${base64hmac}`;
// }
