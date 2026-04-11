import clsx from 'clsx';
import {useRef} from 'react';
import useScroll from 'react-use/esm/useScroll';
import {
  flattenConnection,
  CartForm,
  Image,
  Money,
  useOptimisticData,
  useOptimisticCart,
  OptimisticInput,
  type CartReturn,
} from '@shopify/hydrogen';
import type {
  Cart as CartType,
  CartCost,
  CartLine,
  CartLineUpdateInput,
} from '@shopify/hydrogen/storefront-api-types';

import {Button} from '~/components/Button';
import {Text, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {IconRemove} from '~/components/Icon';
import {FeaturedProducts} from '~/components/FeaturedProducts';
import {getInputStyleClasses} from '~/lib/utils';

type Layouts = 'page' | 'drawer';

export function Cart({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartReturn | null;
}) {
  const optimisticCart = useOptimisticCart(cart);
  const linesCount = Boolean(
    optimisticCart?.lines?.nodes?.length ||
    (optimisticCart?.lines as any)?.edges?.length ||
    0,
  );

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <CartDetails cart={optimisticCart as any} layout={layout} />
    </>
  );
}

type DiscountLine = {
  label: string;
  amount: string;
  currencyCode: string;
};

/** Collects all discount allocations (line-level + cart-level), deduped by label. */
function buildDiscountBreakdown(cart: CartType | null): {
  breakdown: DiscountLine[];
  totalSavings: {amount: string; currencyCode: string} | null;
} {
  type RawAlloc = {
    discountedAmount?: {amount?: string; currencyCode?: string};
    title?: string;
    code?: string;
  };
  const raw: RawAlloc[] = [];

  // Line-level allocations
  const lines: any[] =
    cart?.lines?.nodes ??
    (cart?.lines as any)?.edges?.map((e: any) => e.node) ??
    [];
  for (const line of lines) {
    for (const a of (line?.discountAllocations ?? []) as RawAlloc[]) raw.push(a);
  }

  // Cart-level allocations (automatic discounts based on quantity, etc.)
  for (const a of ((cart as any)?.discountAllocations ?? []) as RawAlloc[]) raw.push(a);

  if (raw.length === 0) return {breakdown: [], totalSavings: null};

  // Group by label and sum amounts
  const byLabel = new Map<string, {amount: number; currencyCode: string}>();
  for (const a of raw) {
    const label = a.title ?? a.code ?? 'Desconto';
    const amt = parseFloat(a.discountedAmount?.amount ?? '0');
    const cur = a.discountedAmount?.currencyCode ?? 'BRL';
    const existing = byLabel.get(label);
    if (existing) existing.amount += amt;
    else byLabel.set(label, {amount: amt, currencyCode: cur});
  }

  const breakdown: DiscountLine[] = Array.from(byLabel.entries()).map(
    ([label, {amount, currencyCode}]) => ({label, amount: amount.toFixed(2), currencyCode}),
  );
  const totalAmount = breakdown.reduce((s, d) => s + parseFloat(d.amount), 0);
  return {
    breakdown,
    totalSavings: totalAmount > 0
      ? {amount: totalAmount.toFixed(2), currencyCode: breakdown[0].currencyCode}
      : null,
  };
}

export function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: CartType | null;
}) {
  const cartHasItems =
    !!cart &&
    (cart.totalQuantity > 0 ||
      (cart.lines?.nodes || (cart.lines as any)?.edges || []).length > 0);
  const container = {
    drawer: 'grid grid-cols-1 grid-rows-[1fr_auto] overflow-hidden min-h-0',
    page: 'w-full pb-12 grid md:grid-cols-2 md:items-start gap-8 md:gap-8 lg:gap-12',
  };

  const {breakdown: discountBreakdown, totalSavings} = buildDiscountBreakdown(cart);

  return (
    <div className={container[layout]}>
      <CartLines lines={cart?.lines} layout={layout} />
      {cartHasItems && (
        <CartSummary
          cost={cart.cost}
          layout={layout}
          totalSavings={totalSavings}
          discountBreakdown={discountBreakdown}
        >
          <CartDiscounts discountCodes={cart.discountCodes} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
        </CartSummary>
      )}
    </div>
  );
}

/**
 * Temporary discount UI
 * @param discountCodes the current discount codes applied to the cart
 * @todo rework when a design is ready
 */
function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartType['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <>
      {/* Have existing discount, display it with a remove option */}
      <dl className={codes && codes.length !== 0 ? 'grid' : 'hidden'}>
        <div className="flex items-center justify-between font-medium">
          <Text as="dt">Desconto(s)</Text>
          <div className="flex items-center justify-between">
            <UpdateDiscountForm>
              <button>
                <IconRemove
                  aria-hidden="true"
                  style={{height: 18, marginRight: 4}}
                />
              </button>
            </UpdateDiscountForm>
            <Text as="dd">{codes?.join(', ')}</Text>
          </div>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div
          className={clsx(
            'flex',
            'items-center gap-4 justify-between text-copy',
          )}
        >
          <input
            className={getInputStyleClasses()}
            type="text"
            name="discountCode"
            placeholder="Código de desconto"
          />
          <button className="flex justify-end font-medium whitespace-nowrap">
            Aplicar Desconto
          </button>
        </div>
      </UpdateDiscountForm>
    </>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLines({
  layout = 'drawer',
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartType['lines'] | undefined;
}) {
  const currentLines = cartLines
    ? (cartLines as any).nodes
      ? (cartLines as any).nodes
      : flattenConnection(cartLines)
    : [];
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

  const className = clsx([
    y > 0 ? 'border-t' : '',
    layout === 'page'
      ? 'flex-grow md:translate-y-4'
      : 'px-6 pb-6 sm-max:pt-2 overflow-y-auto min-h-0 transition md:px-12',
  ]);

  return (
    <section
      ref={scrollRef}
      aria-labelledby="cart-contents"
      className={className}
    >
      <ul className="grid gap-6 md:gap-10">
        {currentLines.map((line: CartLine) => (
          <CartLineItem key={line.id} line={line as CartLine} />
        ))}
      </ul>
    </section>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col mt-2">
      <a href={checkoutUrl} target="_self">
        <Button as="span" width="full">
          Continuar para o Pagamento
        </Button>
      </a>
      {/* @todo: <CartShopPayButton cart={cart} /> */}
    </div>
  );
}

function CartSummary({
  cost,
  layout,
  totalSavings = null,
  discountBreakdown = [],
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartCost;
  layout: Layouts;
  totalSavings?: {amount: string; currencyCode: string} | null;
  discountBreakdown?: DiscountLine[];
}) {
  const summary = {
    drawer: 'grid gap-4 p-6 border-t md:px-12',
    page: 'sticky top-nav grid gap-6 p-4 md:px-6 md:translate-y-4 bg-primary/5 rounded w-full',
  };

  return (
    <section aria-labelledby="summary-heading" className={summary[layout]}>
      <h2 id="summary-heading" className="sr-only">
        Resumo do pedido
      </h2>
      <dl className="grid gap-2">
        {/* Named discount rows (automatic + coupon) */}
        {discountBreakdown.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between text-green-600 dark:text-green-400"
          >
            <Text as="dt" className="text-sm font-medium">✂️ {d.label}</Text>
            <Text as="dd" className="text-sm font-semibold">
              −<Money data={{amount: d.amount, currencyCode: d.currencyCode} as any} />
            </Text>
          </div>
        ))}
        {/* "Você economizou" summary row only when there are multiple discounts */}
        {totalSavings && discountBreakdown.length > 1 && (
          <div className="flex items-center justify-between text-green-600 dark:text-green-400 border-t border-green-100 dark:border-green-900 pt-1 mt-1">
            <Text as="dt" className="text-xs font-medium opacity-80">Total economizado</Text>
            <Text as="dd" className="text-xs font-semibold opacity-80">
              −<Money data={totalSavings as any} />
            </Text>
          </div>
        )}
        <div className="flex items-center justify-between font-medium">
          <Text as="dt">{totalSavings ? 'Total com desconto' : 'Subtotal'}</Text>
          <Text as="dd" data-test="subtotal">
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </Text>
        </div>
      </dl>
      {children}
    </section>
  );
}

type OptimisticData = {
  action?: string;
  quantity?: number;
};

function CartLineItem({line}: {line: CartLine}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);
  const isOptimistic = (line as any).isOptimistic;

  if (!line?.id) return null;

  const {id, quantity, merchandise} = line;

  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  const isOutOfStock = (merchandise as any).availableForSale === false;
  const quantityAvailable = (merchandise as any).quantityAvailable as number | null | undefined;

  // Discount allocations (coupon + automatic)
  const discountAllocations: Array<{
    discountedAmount: {amount: string; currencyCode: string};
    title?: string;
    code?: string;
  }> = (line as any).discountAllocations ?? [];
  const lineDiscountTotal = discountAllocations.reduce(
    (sum, d) => sum + parseFloat(d.discountedAmount?.amount ?? '0'),
    0,
  );
  const hasLineDiscount = lineDiscountTotal > 0;
  const originalLineTotal = hasLineDiscount
    ? ({
        amount: (parseFloat(line.cost.totalAmount.amount) + lineDiscountTotal).toFixed(2),
        currencyCode: line.cost.totalAmount.currencyCode,
      } as any)
    : null;
  // Show urgency when <= 10 units left (and not already OOS)
  const isLowStock =
    !isOutOfStock &&
    quantityAvailable != null &&
    quantityAvailable > 0 &&
    quantityAvailable <= 10;
  const atStockLimit =
    quantityAvailable != null && quantity >= quantityAvailable;

  return (
    <li
      key={id}
      className={clsx(
        'flex gap-4 transition-opacity duration-300',
        isOptimistic && 'opacity-60 animate-pulse',
        isOutOfStock && 'opacity-70',
      )}
      style={{
        display: optimisticData?.action === 'remove' ? 'none' : 'flex',
      }}
    >
      <div className="flex-shrink relative">
        {merchandise.image && (
          <Image
            width={110}
            height={110}
            data={merchandise.image}
            className="object-cover object-center w-24 h-24 border rounded md:w-28 md:h-28"
            alt={merchandise.title}
          />
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-contrast/40 rounded">
            <span className="text-[10px] font-bold text-primary bg-contrast/80 px-1.5 py-0.5 rounded uppercase tracking-wide">
              Esgotado
            </span>
          </span>
        )}
      </div>

      <div className="flex justify-between flex-grow">
        <div className="grid gap-2">
          <Heading as="h3" size="copy">
            {merchandise?.product?.handle ? (
              <Link to={`/products/${merchandise.product.handle}`}>
                {merchandise?.product?.title || ''}
              </Link>
            ) : (
              <Text>{merchandise?.product?.title || ''}</Text>
            )}
          </Heading>

          <div className="grid pb-2">
            {(merchandise?.selectedOptions || []).map((option) => (
              <Text color="subtle" key={option.name}>
                {option.name}: {option.value}
              </Text>
            ))}
          </div>

          {isOutOfStock && (
            <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 font-medium">
              ⚠️ Fora de estoque — remova do carrinho
            </div>
          )}

          {isLowStock && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>⚡</span>
              <span>
                {(() => {
                  const opts = (merchandise?.selectedOptions || [])
                    .filter((o) => o.value && o.value !== 'Default Title')
                    .map((o) => `${o.name.toLowerCase()} ${o.value}`)
                    .join(', ');
                  const qty = `Apenas ${quantityAvailable} ${quantityAvailable === 1 ? 'unidade disponível' : 'unidades disponíveis'}`;
                  return opts ? `${qty} para ${opts}` : qty;
                })()}
              </span>
            </div>
          )}

          {!isOptimistic && (
            <div className="flex items-center gap-2">
              {!isOutOfStock && (
                <div className="flex justify-start text-copy">
                  <CartLineQuantityAdjust
                    line={line}
                    quantityAvailable={quantityAvailable ?? undefined}
                  />
                </div>
              )}
              <ItemRemoveButton lineId={id} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {hasLineDiscount && originalLineTotal && (
            <span className="text-xs text-primary/40 line-through leading-tight">
              <Money withoutTrailingZeros data={originalLineTotal} />
            </span>
          )}
          <span className={hasLineDiscount ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
            <CartLinePrice line={line} as="span" />
          </span>
          {discountAllocations.map((d, i) => (
            <span
              key={i}
              className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded leading-tight"
            >
              {d.title ?? d.code ?? 'Desconto'} −<Money withoutTrailingZeros data={d.discountedAmount as any} />
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

function ItemRemoveButton({lineId}: {lineId: CartLine['id']}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{
        lineIds: [lineId],
      }}
    >
      <button
        className="flex items-center justify-center w-10 h-10 border rounded"
        type="submit"
      >
        <span className="sr-only">Remover</span>
        <IconRemove aria-hidden="true" />
      </button>
      <OptimisticInput id={lineId} data={{action: 'remove'}} />
    </CartForm>
  );
}

function CartLineQuantityAdjust({
  line,
  quantityAvailable,
}: {
  line: CartLine;
  quantityAvailable?: number;
}) {
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  if (!line || typeof line?.quantity === 'undefined') return null;

  const optimisticQuantity = optimisticData?.quantity || line.quantity;

  const {id: lineId} = line;
  const prevQuantity = Number(Math.max(0, optimisticQuantity - 1).toFixed(0));
  const nextQuantity = Number((optimisticQuantity + 1).toFixed(0));

  const atStockLimit =
    quantityAvailable != null && optimisticQuantity >= quantityAvailable;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantidade, {optimisticQuantity}
      </label>
      <div className="flex items-center border rounded">
        <UpdateCartButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            name="decrease-quantity"
            aria-label="Diminuir quantidade"
            className="w-10 h-10 transition text-primary/50 hover:text-primary disabled:text-primary/10"
            value={prevQuantity}
            disabled={optimisticQuantity <= 1}
          >
            <span>&#8722;</span>
            <OptimisticInput
              id={optimisticId}
              data={{quantity: prevQuantity}}
            />
          </button>
        </UpdateCartButton>

        <div className="px-2 text-center" data-test="item-quantity">
          {optimisticQuantity}
        </div>

        <UpdateCartButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            className="w-10 h-10 transition text-primary/50 hover:text-primary disabled:text-primary/20 disabled:cursor-not-allowed"
            name="increase-quantity"
            value={nextQuantity}
            aria-label="Aumentar quantidade"
            disabled={atStockLimit}
          >
            <span>&#43;</span>
            {!atStockLimit && (
              <OptimisticInput
                id={optimisticId}
                data={{quantity: nextQuantity}}
              />
            )}
          </button>
        </UpdateCartButton>
      </div>
      {atStockLimit && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-tight">
          Estoque máximo atingido
        </p>
      )}
    </div>
  );
}

function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{
        lines,
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

export function CartEmpty({
  hidden = false,
  layout = 'drawer',
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

  const container = {
    drawer: clsx([
      'content-start gap-4 px-6 pb-8 transition overflow-y-scroll md:gap-12 md:px-12 h-screen-no-nav md:pb-12',
      y > 0 ? 'border-t' : '',
    ]),
    page: clsx([
      hidden ? '' : 'grid',
      `pb-12 w-full md:items-start gap-4 md:gap-8 lg:gap-12`,
    ]),
  };

  return (
    <div ref={scrollRef} className={container[layout]} hidden={hidden}>
      <section className="grid gap-6 pt-6">
        <Text format>
          Parece que você ainda não adicionou nada, vamos começar!
        </Text>
        <div>
          <Button onClick={onClose}>Continuar comprando</Button>
        </div>
      </section>
      <section className="grid gap-8 pt-16">
        <FeaturedProducts
          count={4}
          heading="Mais Vendidos"
          layout={layout}
          onClose={onClose}
          sortKey="BEST_SELLING"
        />
      </section>
    </div>
  );
}
