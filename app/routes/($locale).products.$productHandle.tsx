import {useRef, Suspense} from 'react';
import {Disclosure, Listbox} from '@headlessui/react';
import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Await} from '@remix-run/react';
import {
  getSeoMeta,
  Money,
  ShopPayButton,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
  type MappedProductOptions,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';

import type {ProductFragment, ProductCardFragment} from 'storefrontapi.generated';
import {Heading, Section, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {AddToCartButton} from '~/components/AddToCartButton';
import {Skeleton} from '~/components/Skeleton';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {ProductGallery} from '~/components/ProductGallery';
import {IconCaret, IconCheck, IconClose} from '~/components/Icon';
import {getExcerpt} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import type {Storefront} from '~/lib/type';
import {routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getInventoryBySaoLourenco} from '~/lib/admin-inventory.server';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  params,
  request,
  context,
}: LoaderFunctionArgs) {
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request);

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  // Fetch inventory for ALL product variants at once from Admin API (São Lourenço).
  // Returning a full map so ProductForm can look up any variant instantly —
  // even during useOptimisticVariant transitions before the next loader completes.
  const allVariantIds: string[] = (product as any).variants?.nodes
    ?.map((v: any) => v.id as string)
    .filter(Boolean) ?? [];
  const inventoryMap = allVariantIds.length
    ? await getInventoryBySaoLourenco(context.env, allVariantIds)
    : new Map<string, number>();
  // Convert to plain object for serialisation through the Remix loader boundary
  const variantInventory: Record<string, number> = {};
  inventoryMap.forEach((qty, id) => { variantInventory[id] = qty; });

  return {
    product,
    variants,
    shop,
    storeDomain: shop.primaryDomain.url,
    recommended,
    seo,
    variantInventory,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData(args: LoaderFunctionArgs) {
  // Put any API calls that are not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Product() {
  const {product, shop, recommended, variants, storeDomain, variantInventory} =
    useLoaderData<typeof loader>();
  const {media, title, vendor, descriptionHtml, tags} = product;
  const {shippingPolicy, refundPolicy} = shop;
  const isDropshipping = tags?.includes('dropshipping');

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  return (
    <>
      <Section className="px-0 md:px-8 lg:px-12">
        <div className="grid items-start md:gap-10 lg:gap-16 md:grid-cols-2 overflow-x-hidden">
          <ProductGallery
            media={media.nodes}
            className="w-full"
            selectedVariantImage={selectedVariant?.image}
          />
          <div className="sticky md:top-nav md:pt-6 hiddenScroll md:overflow-y-auto">
            <section className="flex flex-col w-full max-w-xl gap-6 p-6 md:mx-auto md:px-0">
              {/* Header */}
              <div className="flex flex-col gap-1">
                {vendor && (
                  <Text className="text-primary/50 font-medium text-sm uppercase tracking-wide">
                    {vendor}
                  </Text>
                )}
                <Heading as="h1" className="whitespace-normal text-lg md:text-3xl">
                  {title}
                </Heading>
                {/* Price display */}
                <ProductPrice selectedVariant={selectedVariant} />
              </div>

              {isDropshipping && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm">
                  <span className="text-base leading-none mt-0.5">📦</span>
                  <div className="leading-snug">
                    <p className="font-semibold">Produto sob encomenda</p>
                    <p className="text-blue-800/90">
                      Este item não tem pronta entrega. Após a confirmação do pagamento, o prazo estimado de chegada é de <strong>15 a 25 dias úteis</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Variant selector & add to cart */}
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
                variantInventory={variantInventory}
              />

              {/* Description inline (not accordion) */}
              {descriptionHtml && (
                <div className="pt-4 border-t border-primary/10">
                  <Text as="h4" size="lead" className="mb-3 font-semibold">
                    Descrição
                  </Text>
                  <div
                    className="prose dark:prose-invert text-primary/70 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{__html: descriptionHtml}}
                  />
                </div>
              )}

              {/* Policies in accordion */}
              <div className="grid gap-3 pt-2">
                {shippingPolicy?.body && (
                  <ProductDetail
                    title="Envio"
                    content={getExcerpt(shippingPolicy.body)}
                    learnMore={`/policies/${shippingPolicy.handle}`}
                  />
                )}
                {refundPolicy?.body && (
                  <ProductDetail
                    title="Devoluções"
                    content={getExcerpt(refundPolicy.body)}
                    learnMore={`/policies/${refundPolicy.handle}`}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </Section>
      <Suspense fallback={<Skeleton className="h-32" />}>
        <Await
          errorElement="Houve um problema ao carregar produtos relacionados"
          resolve={recommended}
        >
          {(products) => (
            <ProductSwimlane title="Produtos Relacionados" products={products as {nodes: ProductCardFragment[]}} />
          )}
        </Await>
      </Suspense>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

export function ProductForm({
  productOptions,
  selectedVariant,
  storeDomain,
  variantInventory = {},
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
  variantInventory?: Record<string, number>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  const isOutOfStock = !selectedVariant?.availableForSale;
  // Look up inventory for the CURRENT selected variant — works instantly
  // even during useOptimisticVariant transitions (all variants loaded upfront).
  const variantId = (selectedVariant as any)?.id as string | undefined;
  const qty: number | null =
    variantId !== undefined && variantId in variantInventory
      ? variantInventory[variantId]
      : null;
  const isLowStock = !isOutOfStock && qty !== null && qty > 0 && qty <= 10;

  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount &&
    selectedVariant?.price?.amount < selectedVariant?.compareAtPrice?.amount;

  const selectedOptionName = (optionIndex: number) =>
    selectedVariant?.selectedOptions[optionIndex]?.value;

  const hasSwatches = (option: MappedProductOptions) =>
    option.optionValues.some((v) => v.swatch?.color || v.swatch?.image?.previewImage?.url);

  return (
    <div className="grid gap-6">
      {isOutOfStock && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <span>⚠️</span>
          <span className="font-medium">Variante esgotada.</span>
          <span className="opacity-70">Selecione outra opção ou volte em breve.</span>
        </div>
      )}
      <div className="grid gap-5">
        {productOptions.map((option, optionIndex) => (
          <div
            key={option.name}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Text as="legend" className="font-semibold text-sm">
                {option.name}
              </Text>
              <Text className="text-primary/50 text-sm">
                {selectedOptionName(optionIndex)}
              </Text>
            </div>

            {option.optionValues.length > 7 ? (
              <div className="relative w-full">
                <Listbox>
                  {({open}) => (
                    <>
                      <Listbox.Button
                        ref={closeRef}
                        className={clsx(
                          'flex items-center justify-between w-full py-3 px-4 border border-primary/20 bg-contrast text-sm',
                          open
                            ? 'rounded-t'
                            : 'rounded-lg',
                        )}
                      >
                        <span>{selectedOptionName(optionIndex)}</span>
                        <IconCaret direction={open ? 'up' : 'down'} />
                      </Listbox.Button>
                      <Listbox.Options
                        className={clsx(
                          'border-primary/20 bg-contrast absolute z-30 w-full max-h-48 overflow-y-auto rounded-b-lg border border-t-0 shadow-lg',
                          open ? 'block' : 'hidden',
                        )}
                      >
                        {option.optionValues
                          .filter((value) => value.available)
                          .map(
                            ({
                              isDifferentProduct,
                              name,
                              variantUriQuery,
                              handle,
                              selected,
                            }) => (
                              <Listbox.Option
                                key={`option-${option.name}-${name}`}
                                value={name}
                              >
                                <Link
                                  {...(!isDifferentProduct
                                    ? {rel: 'nofollow'}
                                    : {})}
                                  to={`/products/${handle}?${variantUriQuery}`}
                                  preventScrollReset
                                  className={clsx(
                                    'text-primary w-full px-4 py-2.5 text-sm transition flex justify-between items-center cursor-pointer hover:bg-primary/5',
                                    selected && 'bg-primary/10 font-medium',
                                  )}
                                  onClick={() => {
                                    if (!closeRef?.current) return;
                                    closeRef.current.click();
                                  }}
                                >
                                  {name}
                                  {selected && (
                                    <IconCheck />
                                  )}
                                </Link>
                              </Listbox.Option>
                            ),
                          )}
                      </Listbox.Options>
                    </>
                  )}
                </Listbox>
              </div>
            ) : hasSwatches(option) ? (
              <div className="flex flex-wrap items-center gap-2">
                {option.optionValues.map(
                  ({
                    isDifferentProduct,
                    name,
                    variantUriQuery,
                    handle,
                    selected,
                    available,
                    swatch,
                  }) => (
                    <Link
                      key={option.name + name}
                      {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                      to={`/products/${handle}?${variantUriQuery}`}
                      preventScrollReset
                      prefetch="intent"
                      replace
                      title={name}
                      className={clsx(
                        'relative rounded-full w-10 h-10 border-2 transition-all duration-200 cursor-pointer',
                        selected
                          ? 'border-primary ring-2 ring-primary/20 ring-offset-1'
                          : 'border-primary/20 hover:border-primary/50',
                        !available && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      <SwatchContent swatch={swatch} name={name} />
                      {!available && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block w-[1px] h-full bg-primary/50 rotate-45 absolute" />
                        </span>
                      )}
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {option.optionValues.map(
                  ({
                    isDifferentProduct,
                    name,
                    variantUriQuery,
                    handle,
                    selected,
                    available,
                  }) => (
                    <Link
                      key={option.name + name}
                      {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                      to={`/products/${handle}?${variantUriQuery}`}
                      preventScrollReset
                      prefetch="intent"
                      replace
                      className={clsx(
                        'relative px-4 py-2 text-sm border rounded-lg transition-all duration-200 cursor-pointer overflow-hidden',
                        selected
                          ? 'border-primary bg-primary text-contrast font-medium'
                          : 'border-primary/20 hover:border-primary/50',
                        !available && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      {name}
                      {!available && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="block w-px h-full bg-primary/60 rotate-45 absolute" />
                        </span>
                      )}
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add to cart */}
      {selectedVariant && (
        <div className="grid items-stretch gap-3 pt-2">
          {isLowStock && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium">
              <span>⚡</span>
              <span>
                {(() => {
                  const opts = (selectedVariant?.selectedOptions || [])
                    .filter((o: {name: string; value: string}) => o.value && o.value !== 'Default Title')
                    .map((o: {name: string; value: string}) => `${o.name.toLowerCase()} ${o.value}`)
                    .join(', ');
                  const base = `Apenas ${qty} ${qty === 1 ? 'unidade disponível' : 'unidades disponíveis'}`;
                  return opts ? `${base} para ${opts}` : base;
                })()}
              </span>
            </div>
          )}
          {isOutOfStock ? (
            <Button variant="secondary" disabled className="rounded-lg py-3">
              <Text>Esgotado</Text>
            </Button>
          ) : (
            <AddToCartButton
              lines={[
                {
                  merchandiseId: selectedVariant.id!,
                  quantity: 1,
                  selectedVariant,
                },
              ]}
              variant="primary"
              data-test="add-to-cart"
              className="rounded-lg py-3"
            >
              <Text
                as="span"
                className="flex items-center justify-center gap-2 text-base"
              >
                Adicionar ao Carrinho
              </Text>
            </AddToCartButton>
          )}
          {!isOutOfStock && (
            <ShopPayButton
              width="100%"
              variantIds={[selectedVariant?.id!]}
              storeDomain={storeDomain}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SwatchContent({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  return (
    <span
      aria-label={name}
      className="block w-full h-full rounded-full overflow-hidden"
      style={{
        backgroundColor: color || '#e5e5e5',
      }}
    >
      {!!image && (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      )}
    </span>
  );
}

function ProductPrice({
  selectedVariant,
}: {
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  if (!selectedVariant) return null;

  const isOnSale =
    selectedVariant.price?.amount &&
    selectedVariant.compareAtPrice?.amount &&
    selectedVariant.price.amount < selectedVariant.compareAtPrice.amount;

  return (
    <div className="flex items-center gap-3 mt-1" data-test="price">
      <Money
        withoutTrailingZeros
        data={selectedVariant.price!}
        as="span"
        className={clsx(
          'text-xl font-semibold',
          isOnSale && 'text-red-600 dark:text-red-400',
        )}
      />
      {isOnSale && (
        <Money
          withoutTrailingZeros
          data={selectedVariant.compareAtPrice!}
          as="span"
          className="text-base text-primary/40 line-through"
        />
      )}
      {isOnSale && (
        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
          {Math.round(
            (1 -
              parseFloat(selectedVariant.price!.amount) /
                parseFloat(selectedVariant.compareAtPrice!.amount)) *
              100,
          )}
          % OFF
        </span>
      )}
    </div>
  );
}

function ProductDetail({
  title,
  content,
  learnMore,
}: {
  title: string;
  content: string;
  learnMore?: string;
}) {
  return (
    <Disclosure key={title} as="div" className="border border-primary/10 rounded-lg overflow-hidden">
      {({open}) => (
        <>
          <Disclosure.Button className="flex justify-between items-center w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors">
            <Text as="h4" className="font-semibold text-sm">
              {title}
            </Text>
            <IconCaret direction={open ? 'up' : 'down'} />
          </Disclosure.Button>

          <Disclosure.Panel className="px-4 pb-4 pt-1">
            <div
              className="prose dark:prose-invert text-sm text-primary/70 leading-relaxed"
              dangerouslySetInnerHTML={{__html: content}}
            />
            {learnMore && (
              <Link
                className="inline-block mt-2 text-sm text-primary/60 hover:text-primary underline underline-offset-2"
                to={learnMore}
              >
                Saiba mais
              </Link>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    tags
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 100) {
      nodes {
        id
      }
    }
    seo {
      description
      title
    }
    media(first: 7) {
      nodes {
        ...Media
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = ((products.recommended ?? []) as ProductCardFragment[])
    .concat(products.additional.nodes as ProductCardFragment[])
    .filter(
      (value: ProductCardFragment, index: number, array: ProductCardFragment[]) =>
        array.findIndex((value2: ProductCardFragment) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item: ProductCardFragment) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}
