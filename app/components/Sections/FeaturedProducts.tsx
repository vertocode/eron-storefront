import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';
import type {ProductCardFragment} from 'storefrontapi.generated';

export type FeaturedProductsProps = {
  title?: string;
  count?: number;
  products?: ProductCardFragment[];
};

const mockProducts = new Array(4).fill('') as ProductCardFragment[];

function sortOosLast(products: ProductCardFragment[]) {
  return [...products].sort((a, b) => {
    const aOos = !a?.variants?.nodes?.[0]?.availableForSale;
    const bOos = !b?.variants?.nodes?.[0]?.availableForSale;
    if (aOos === bOos) return 0;
    return aOos ? 1 : -1;
  });
}

export function FeaturedProducts({
  title = 'Produtos em Destaque',
  count = 8,
  products = mockProducts,
}: FeaturedProductsProps) {
  const sorted = sortOosLast(products);
  return (
    <Section heading={title} padding="y">
      <div className="swimlane hiddenScroll md:pb-8 md:scroll-px-8 lg:scroll-px-12 md:px-8 lg:px-12">
        {sorted.slice(0, count).map((product) => (
          <ProductCard
            product={product}
            key={product.id}
            className="snap-start w-80"
          />
        ))}
      </div>
    </Section>
  );
}
