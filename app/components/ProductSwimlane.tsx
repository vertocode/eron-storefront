import type {HomepageFeaturedProductsQuery} from 'storefrontapi.generated';
import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';

const mockProducts = {
  nodes: new Array(12).fill(''),
};

type ProductSwimlaneProps = HomepageFeaturedProductsQuery & {
  title?: string;
  count?: number;
};

function sortProductsOosLast(nodes: any[]) {
  return [...nodes].sort((a, b) => {
    const aOos = !a?.variants?.nodes?.[0]?.availableForSale;
    const bOos = !b?.variants?.nodes?.[0]?.availableForSale;
    if (aOos === bOos) return 0;
    return aOos ? 1 : -1;
  });
}

export function ProductSwimlane({
  title = 'Produtos em Destaque',
  products = mockProducts,
  count = 12,
  ...props
}: ProductSwimlaneProps) {
  const sorted = sortProductsOosLast(products.nodes);
  return (
    <Section heading={title} padding="y" {...props}>
      <div className="swimlane hiddenScroll md:pb-8 md:scroll-px-8 lg:scroll-px-12 md:px-8 lg:px-12">
        {sorted.map((product) => (
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
