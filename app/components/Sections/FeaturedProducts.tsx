import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';
import type {ProductCardFragment} from 'storefrontapi.generated';

export type FeaturedProductsProps = {
  title?: string;
  count?: number;
  products?: ProductCardFragment[];
};

const mockProducts = new Array(4).fill('') as ProductCardFragment[];

export function FeaturedProducts({
  title = 'Featured Products',
  count = 8,
  products = mockProducts,
}: FeaturedProductsProps) {
  return (
    <Section heading={title} padding="y">
      <div className="swimlane hiddenScroll md:pb-8 md:scroll-px-8 lg:scroll-px-12 md:px-8 lg:px-12">
        {products.slice(0, count).map((product) => (
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
