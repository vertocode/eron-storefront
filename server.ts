// @ts-ignore
// Virtual entry point for the app
import * as remixBuild from 'virtual:remix/server-build';
import {
  createRequestHandler,
  getStorefrontHeaders,
} from '@shopify/remix-oxygen';
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  storefrontRedirect,
  createCustomerAccountClient,
} from '@shopify/hydrogen';

import {AppSession} from '~/lib/session.server';
import {getLocaleFromRequest} from '~/lib/utils';

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      /**
       * Open a cache instance in the worker and a custom session instance.
       */
      if (!env?.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is not set');
      }

      const waitUntil = executionContext.waitUntil.bind(executionContext);
      const [cache, session] = await Promise.all([
        caches.open('hydrogen'),
        AppSession.init(request, [env.SESSION_SECRET]),
      ]);

      /**
       * Create Hydrogen's Storefront client.
       */
      const {storefront} = createStorefrontClient({
        cache,
        waitUntil,
        i18n: getLocaleFromRequest(request),
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: env.PUBLIC_STORE_DOMAIN,
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        storefrontHeaders: getStorefrontHeaders(request),
      });

      /**
       * Create a client for Customer Account API.
       */
      const customerAccount = createCustomerAccountClient({
        waitUntil,
        request,
        session,
        customerAccountId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
        shopId: env.SHOP_ID,
      });

      // Override default cart fragment: Hydrogen's default uses `edges { node {} }`
      // but `useOptimisticCart` reads `lines.nodes` — causing a crash on 2nd add-to-cart.
      const CART_FRAGMENT = `#graphql
        fragment CartApiQuery on Cart {
          updatedAt
          id
          checkoutUrl
          totalQuantity
          buyerIdentity {
            countryCode
            customer {
              id
              email
              firstName
              lastName
              displayName
            }
            email
            phone
          }
          lines(first: $numCartLines) {
            nodes {
              id
              quantity
              attributes { key value }
              cost {
                totalAmount { amount currencyCode }
                amountPerQuantity { amount currencyCode }
                compareAtAmountPerQuantity { amount currencyCode }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  availableForSale
                  quantityAvailable
                  compareAtPrice { ...CartApiMoney }
                  price { ...CartApiMoney }
                  requiresShipping
                  title
                  image { ...CartApiImage }
                  product { handle title id vendor }
                  selectedOptions { name value }
                }
              }
            }
          }
          cost {
            subtotalAmount { ...CartApiMoney }
            totalAmount { ...CartApiMoney }
            totalDutyAmount { ...CartApiMoney }
            totalTaxAmount { ...CartApiMoney }
          }
          note
          attributes { key value }
          discountCodes { applicable code }
        }
        fragment CartApiMoney on MoneyV2 { currencyCode amount }
        fragment CartApiImage on Image { id url altText width height }
      `;

      const cart = createCartHandler({
        storefront,
        customerAccount,
        getCartId: cartGetIdDefault(request.headers),
        setCartId: cartSetIdDefault(),
        // cartQueryFragment overrides the fragment used by cart.get().
        // Hydrogen's default uses `lines { edges { node {} } }` but useOptimisticCart
        // reads `lines.nodes` — so without this fix the 2nd add-to-cart crashes:
        //   optimisticCart.lines.nodes → undefined → .push() → TypeError
        // Note: cartMutateFragment is NOT overridden because mutations use
        //   `...CartApiMutation` spread name, not `...CartApiQuery`.
        cartQueryFragment: CART_FRAGMENT,
      });

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => ({
          session,
          waitUntil,
          storefront,
          customerAccount,
          cart,
          env,
        }),
      });

      const response = await handleRequest(request);

      if (session.isPending) {
        response.headers.set('Set-Cookie', await session.commit());
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({request, response, storefront});
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return new Response('Ocorreu um erro inesperado', {status: 500});
    }
  },
};
