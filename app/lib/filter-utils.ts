import type {Filter, ProductFilter} from '@shopify/hydrogen/storefront-api-types';

const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', '2GG', 'XXG'];

const COR_LABEL = 'Cor';
const TAMANHO_LABEL = 'Tamanho';

export type ProductOptionsNode = {
  options: Array<{name: string; values: string[]}>;
};

/**
 * Build a Cor + Tamanho filter list from the product options of a collection,
 * formatted to match the shape Shopify's Storefront API returns so SortFilter
 * can render them with the existing markup. This lets us sidestep Shopify's
 * Search & Discovery config entirely.
 */
export function buildCorTamanhoFilters(
  products: ProductOptionsNode[],
): Filter[] {
  const colors = new Set<string>();
  const sizes = new Set<string>();

  for (const product of products) {
    for (const opt of product.options ?? []) {
      const name = opt.name?.trim().toLowerCase();
      if (name === 'cor') opt.values.forEach((v) => v && colors.add(v));
      else if (name === 'tamanho') opt.values.forEach((v) => v && sizes.add(v));
    }
  }

  const filters: Filter[] = [];

  if (sizes.size > 0) {
    const sorted = [...sizes].sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a.toUpperCase());
      const bi = SIZE_ORDER.indexOf(b.toUpperCase());
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b, 'pt-BR');
    });
    filters.push({
      id: 'filter.v.option.tamanho',
      label: TAMANHO_LABEL,
      type: 'LIST' as Filter['type'],
      values: sorted.map((value) => ({
        id: `filter.v.option.tamanho.${value}`,
        label: value,
        count: 0,
        input: JSON.stringify({
          variantOption: {name: TAMANHO_LABEL, value},
        }),
      })),
    });
  }

  if (colors.size > 0) {
    const sorted = [...colors].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    filters.push({
      id: 'filter.v.option.cor',
      label: COR_LABEL,
      type: 'LIST' as Filter['type'],
      values: sorted.map((value) => ({
        id: `filter.v.option.cor.${value}`,
        label: value,
        count: 0,
        input: JSON.stringify({
          variantOption: {name: COR_LABEL, value},
        }),
      })),
    });
  }

  return filters;
}

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
