import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';

export type VariantStockNode = {
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
};

export type ProductWithVariantStock = {
  variantStock?: {nodes: VariantStockNode[]} | null;
};

/**
 * Post-filter products so each remaining product has at least one in-stock
 * variant matching every active variantOption filter group. Within a group
 * (same option name) the user-selected values are OR'd; across groups they
 * are AND'd — matching Shopify's own filter semantics, but with stock applied
 * to the specific variant rather than the product as a whole.
 *
 * If no variantOption filters are active, every product passes through.
 */
export function keepProductsWithMatchingInStockVariant<
  T extends ProductWithVariantStock,
>(products: T[], productFilters: ProductFilter[]): T[] {
  const constraints = new Map<string, Set<string>>();
  for (const f of productFilters) {
    const opt = (f as any).variantOption as
      | {name?: string; value?: string}
      | undefined;
    if (opt?.name && opt.value != null) {
      const set = constraints.get(opt.name) ?? new Set<string>();
      set.add(opt.value);
      constraints.set(opt.name, set);
    }
  }
  if (constraints.size === 0) return products;

  return products.filter((product) => {
    const variants = product.variantStock?.nodes ?? [];
    return variants.some((variant) => {
      if (!variant.availableForSale) return false;
      const opts = new Map(
        variant.selectedOptions.map((o) => [o.name, o.value] as const),
      );
      for (const [name, allowed] of constraints) {
        const value = opts.get(name);
        if (value == null || !allowed.has(value)) return false;
      }
      return true;
    });
  });
}
