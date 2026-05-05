/**
 * Server-side helpers for the post-purchase review flow.
 * Uses the same Admin API client/cache as admin-inventory.server.ts.
 */

import {
  getAdminToken,
  resolveAdminEnv,
  ADMIN_GRAPHQL_API_VERSION,
} from './admin-inventory.server';

interface AdminEnv {
  SHOPIFY_ADMIN_CLIENT_ID?: string;
  SHOPIFY_ADMIN_CLIENT_SECRET?: string;
  SHOPIFY_ADMIN_DOMAIN?: string;
}

async function adminGraphQL<T = any>(
  env: AdminEnv,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{data?: T; errors?: any[]}> {
  const {domain} = resolveAdminEnv(env);
  const token = await getAdminToken(env);
  const res = await fetch(
    `https://${domain}/admin/api/${ADMIN_GRAPHQL_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  if (!res.ok) throw new Error(`Admin GraphQL ${res.status}`);
  return res.json() as any;
}

export type OrderForReview = {
  id: string;
  legacyResourceId: string;
  name: string;
  customerEmail: string | null;
  customerName: string | null;
  fulfillmentStatus: string | null;
  lineItems: Array<{
    productId: string;
    productHandle: string;
    productTitle: string;
    productImage: string | null;
  }>;
};

const ORDER_QUERY = `#graphql
  query OrderForReview($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      email
      customer {
        firstName
        lastName
      }
      displayFulfillmentStatus
      lineItems(first: 50) {
        nodes {
          product {
            id
            handle
            title
            featuredImage {
              url
            }
          }
        }
      }
    }
  }
`;

export async function getOrderForReview(
  env: AdminEnv,
  legacyOrderId: string,
): Promise<OrderForReview | null> {
  const gid = `gid://shopify/Order/${legacyOrderId}`;
  try {
    const result = await adminGraphQL<{order: any}>(env, ORDER_QUERY, {id: gid});
    const order = result.data?.order;
    if (!order) return null;

    const seen = new Set<string>();
    const lineItems: OrderForReview['lineItems'] = [];
    for (const li of order.lineItems?.nodes ?? []) {
      const product = li?.product;
      if (!product?.id || seen.has(product.id)) continue;
      seen.add(product.id);
      lineItems.push({
        productId: product.id,
        productHandle: product.handle,
        productTitle: product.title,
        productImage: product.featuredImage?.url ?? null,
      });
    }

    const first = order.customer?.firstName?.trim() ?? '';
    const last = order.customer?.lastName?.trim() ?? '';
    const customerName = [first, last].filter(Boolean).join(' ') || null;

    return {
      id: order.id,
      legacyResourceId: order.legacyResourceId,
      name: order.name,
      customerEmail: order.email ?? null,
      customerName,
      fulfillmentStatus: order.displayFulfillmentStatus ?? null,
      lineItems,
    };
  } catch {
    return null;
  }
}

export type ReviewSubmission = {
  orderLegacyId: string;
  productId: string;
  productHandle: string;
  rating: number;
  author: string;
  title?: string;
  body?: string;
};

const METAOBJECT_BY_HANDLE = `#graphql
  query ReviewByHandle($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
    }
  }
`;

const METAOBJECT_UPSERT = `#graphql
  mutation UpsertReview(
    $handle: MetaobjectHandleInput!
    $metaobject: MetaobjectUpsertInput!
  ) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        handle
      }
      userErrors { field message code }
    }
  }
`;

const PRODUCT_REVIEWS_METAFIELD = `#graphql
  query ProductReviews($id: ID!) {
    product(id: $id) {
      metafield(namespace: "custom", key: "reviews") {
        value
      }
    }
  }
`;

const PRODUCT_METAFIELD_SET = `#graphql
  mutation ProductMetafieldSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message code }
    }
  }
`;

function reviewHandle(orderLegacyId: string, productHandle: string): string {
  // Handles must be lowercase / hyphenated / URL-safe. Truncate to be safe.
  const safeHandle = productHandle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `order-${orderLegacyId}-${safeHandle}`;
}

export async function submitReview(
  env: AdminEnv,
  input: ReviewSubmission,
): Promise<{ok: true} | {ok: false; error: string}> {
  const handle = reviewHandle(input.orderLegacyId, input.productHandle);

  // Idempotency: if a review for this (order, product) already exists, we
  // upsert it (update content); otherwise create + append the reference to
  // the product's custom.reviews metafield.
  let isNew = true;
  try {
    const existing = await adminGraphQL<{
      metaobjectByHandle: {id: string} | null;
    }>(env, METAOBJECT_BY_HANDLE, {
      handle: {type: 'customer_review', handle},
    });
    isNew = !existing.data?.metaobjectByHandle;
  } catch {
    /* fall through */
  }

  const fields: Array<{key: string; value: string}> = [
    {key: 'rating', value: String(Math.max(1, Math.min(5, Math.round(input.rating))))},
    {key: 'author', value: input.author.slice(0, 80)},
    {key: 'verified', value: 'true'},
    {
      key: 'date',
      value: new Date().toISOString().slice(0, 10),
    },
  ];
  if (input.title?.trim()) {
    fields.push({key: 'title', value: input.title.trim().slice(0, 120)});
  }
  if (input.body?.trim()) {
    fields.push({key: 'body', value: input.body.trim().slice(0, 2000)});
  }

  let upserted;
  try {
    upserted = await adminGraphQL<{
      metaobjectUpsert: {
        metaobject: {id: string; handle: string} | null;
        userErrors: Array<{field?: string[]; message: string; code?: string}>;
      };
    }>(env, METAOBJECT_UPSERT, {
      handle: {type: 'customer_review', handle},
      metaobject: {fields},
    });
  } catch (e) {
    return {ok: false, error: 'Falha ao criar a avaliação. Tente novamente.'};
  }

  const errors = upserted.data?.metaobjectUpsert?.userErrors ?? [];
  const review = upserted.data?.metaobjectUpsert?.metaobject;
  if (errors.length || !review?.id) {
    return {
      ok: false,
      error: errors[0]?.message ?? 'Não foi possível salvar a avaliação.',
    };
  }

  if (!isNew) {
    // Already linked to the product on the previous submission — done.
    return {ok: true};
  }

  // Append the new review GID to the product's custom.reviews metafield.
  try {
    const current = await adminGraphQL<{
      product: {metafield: {value: string} | null} | null;
    }>(env, PRODUCT_REVIEWS_METAFIELD, {id: input.productId});
    let existing: string[] = [];
    const raw = current.data?.product?.metafield?.value;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          existing = parsed.filter(
            (s): s is string => typeof s === 'string',
          );
        }
      } catch {
        /* malformed list, start fresh */
      }
    }
    if (!existing.includes(review.id)) existing.push(review.id);

    await adminGraphQL(env, PRODUCT_METAFIELD_SET, {
      metafields: [
        {
          ownerId: input.productId,
          namespace: 'custom',
          key: 'reviews',
          type: 'list.metaobject_reference',
          value: JSON.stringify(existing),
        },
      ],
    });
  } catch (e) {
    // Review created but not linked — the merchant can manually link it.
    return {ok: true};
  }

  return {ok: true};
}
