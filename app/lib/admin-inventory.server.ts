/**
 * Admin API inventory helper — São Lourenço (location 88274763997) as stock source.
 * Token is cached in the Oxygen/Cloudflare Cache API for 23 h to avoid hitting
 * the token endpoint on every request.
 * Falls back to empty Map on any error → badges degrade gracefully.
 */

const SAO_LOURENCO_GID = 'gid://shopify/Location/88274763997';
const ADMIN_API_VERSION = '2024-10';
const TOKEN_CACHE_KEY = 'https://cache.internal/shopify-admin-token';

interface AdminEnv {
  SHOPIFY_ADMIN_CLIENT_ID?: string;
  SHOPIFY_ADMIN_CLIENT_SECRET?: string;
  /** myshopify domain, e.g. "eronfit.myshopify.com" */
  SHOPIFY_ADMIN_DOMAIN?: string;
}

async function fetchFreshToken(env: AdminEnv): Promise<string> {
  const res = await fetch(
    `https://${env.SHOPIFY_ADMIN_DOMAIN!}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.SHOPIFY_ADMIN_CLIENT_ID!,
        client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET!,
      }).toString(),
    },
  );
  if (!res.ok) throw new Error(`Admin token fetch failed: ${res.status}`);
  const {access_token} = (await res.json()) as {access_token: string};
  return access_token;
}

async function getAdminToken(env: AdminEnv): Promise<string> {
  // Try the Oxygen/Cloudflare Cache API first
  try {
    const cache = await (caches as any).open('hydrogen');
    const cached = await cache.match(new Request(TOKEN_CACHE_KEY));
    if (cached) return (cached as Response).text();

    const token = await fetchFreshToken(env);
    await cache.put(
      new Request(TOKEN_CACHE_KEY),
      new Response(token, {
        headers: {'Cache-Control': 'max-age=82800'}, // 23 h
      }),
    );
    return token;
  } catch {
    // Cache API not available (local dev) — fetch fresh every time
    return fetchFreshToken(env);
  }
}

/**
 * Returns Map<variantGid, quantityAvailable> at São Lourenço.
 * Returns empty Map on any error (graceful degradation).
 */
export async function getInventoryBySaoLourenco(
  env: AdminEnv,
  variantGids: string[],
): Promise<Map<string, number>> {
  if (!variantGids.length) return new Map();
  if (!env.SHOPIFY_ADMIN_CLIENT_ID || !env.SHOPIFY_ADMIN_CLIENT_SECRET || !env.SHOPIFY_ADMIN_DOMAIN) {
    return new Map();
  }
  try {
    const token = await getAdminToken(env);
    const query = `
      query GetInventory($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            inventoryItem {
              inventoryLevel(locationId: "${SAO_LOURENCO_GID}") {
                quantities(names: ["available"]) {
                  name
                  quantity
                }
              }
            }
          }
        }
      }
    `;
    const res = await fetch(
      `https://${env.SHOPIFY_ADMIN_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({query, variables: {ids: variantGids}}),
      },
    );
    if (!res.ok) return new Map();
    const data = (await res.json()) as {
      data?: {
        nodes?: Array<{
          id?: string;
          inventoryItem?: {
            inventoryLevel?: {
              quantities: Array<{name: string; quantity: number}>;
            };
          };
        }>;
      };
    };
    const result = new Map<string, number>();
    for (const node of data.data?.nodes ?? []) {
      if (!node?.id) continue;
      const qty = node.inventoryItem?.inventoryLevel?.quantities?.find(
        (q) => q.name === 'available',
      )?.quantity;
      if (qty !== undefined) result.set(node.id, qty);
    }
    return result;
  } catch {
    return new Map();
  }
}
