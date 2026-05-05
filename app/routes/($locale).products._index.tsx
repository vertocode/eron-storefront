import {useEffect} from 'react';
import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, useNavigate} from '@remix-run/react';
import {useInView} from 'react-intersection-observer';
import invariant from 'tiny-invariant';
import {
  Pagination,
  getPaginationVariables,
  getSeoMeta,
} from '@shopify/hydrogen';

import {PageHeader, Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';
import {Grid} from '~/components/Grid';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import type {ProductCardFragment} from 'storefrontapi.generated';
import {getImageLoadingPriority} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

const PAGE_BY = 20;

export const headers = routeHeaders;

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const variables = getPaginationVariables(request, {pageBy: PAGE_BY});

  const data = await storefront.query(ALL_PRODUCTS_QUERY, {
    variables: {
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  invariant(data, 'No data returned from Shopify API');

  const productsDescription =
    'Todos os produtos Eron Fit em um só lugar: leggings, tops, shorts, calças e conjuntos fitness femininos com tecido tecnológico, modelagem que valoriza e caimento que não decepciona. Frete para todo o Brasil.';
  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'all-products',
      title: 'Todos os Produtos',
      handle: 'products',
      descriptionHtml: productsDescription,
      description: productsDescription,
      seo: {
        title: 'Todos os Produtos',
        description: productsDescription,
      },
      metafields: [],
      products: data.products,
      updatedAt: '',
    },
  });

  return json({
    products: data.products,
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function AllProducts() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading="Todos os Produtos" variant="allCollections" />
      <Section>
        <Pagination connection={products}>
          {({nodes, isLoading, nextPageUrl, hasNextPage, state}) => (
            <InfiniteProductGrid
              nodes={nodes as ProductCardFragment[]}
              isLoading={isLoading}
              nextPageUrl={nextPageUrl}
              hasNextPage={hasNextPage}
              state={state}
            />
          )}
        </Pagination>
      </Section>
    </>
  );
}

function InfiniteProductGrid({
  nodes,
  isLoading,
  nextPageUrl,
  hasNextPage,
  state,
}: {
  nodes: ProductCardFragment[];
  isLoading: boolean;
  nextPageUrl: string;
  hasNextPage: boolean;
  state: any;
}) {
  const {ref, inView} = useInView();
  const navigate = useNavigate();

  useEffect(() => {
    if (inView && hasNextPage) {
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }
  }, [inView, hasNextPage, nextPageUrl, state, navigate]);

  return (
    <>
      <Grid data-test="product-grid">
        {nodes.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={getImageLoadingPriority(i)}
          />
        ))}
      </Grid>
      {hasNextPage && (
        <div
          ref={ref}
          className="flex items-center justify-center mt-10 h-12"
          aria-hidden={!isLoading}
        >
          {isLoading && (
            <span
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
              role="status"
              aria-label="Carregando mais produtos"
            />
          )}
        </div>
      )}
    </>
  );
}

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
