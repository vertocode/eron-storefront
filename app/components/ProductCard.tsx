import clsx from 'clsx';
import {flattenConnection, Image, Money, useMoney} from '@shopify/hydrogen';
import type {MoneyV2, Product} from '@shopify/hydrogen/storefront-api-types';

import type {ProductCardFragment} from 'storefrontapi.generated';
import {Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {AddToCartButton} from '~/components/AddToCartButton';
import {isDiscounted, isNewArrival} from '~/lib/utils';
import {getProductPlaceholder} from '~/lib/placeholders';

export function ProductCard({
  product,
  label,
  className,
  loading,
  onClick,
  quickAdd,
}: {
  product: ProductCardFragment;
  label?: string;
  className?: string;
  loading?: HTMLImageElement['loading'];
  onClick?: () => void;
  quickAdd?: boolean;
}) {
  let cardLabel;

  const cardProduct: Product = product?.variants
    ? (product as Product)
    : getProductPlaceholder();
  if (!cardProduct?.variants?.nodes?.length) return null;

  const firstVariant = flattenConnection(cardProduct.variants)[0];

  if (!firstVariant) return null;
  const {image, price, compareAtPrice} = firstVariant;

  const isOutOfStock = cardProduct.availableForSale === false;
  const isFirstVariantOutOfStock = !firstVariant.availableForSale;
  const quantityAvailable = (firstVariant as any).quantityAvailable as number | null | undefined;
  const isLowStock = !isOutOfStock && !isFirstVariantOutOfStock && quantityAvailable != null && quantityAvailable > 0 && quantityAvailable < 5;
  const isPremium = (cardProduct.collections?.nodes ?? []).some(
    (c) => c?.handle?.toLowerCase() === 'premium',
  );

  const productImages = cardProduct.images?.nodes ?? [];
  const firstImage = productImages[0] ?? image;
  const secondImage = productImages[1] ?? null;

  if (label) {
    cardLabel = label;
  } else if (isOutOfStock) {
    cardLabel = null;
  } else if (isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2)) {
    cardLabel = 'Promoção';
  } else if (isNewArrival(product.publishedAt)) {
    cardLabel = 'Novo';
  }

  return (
    <div className={clsx('flex flex-col gap-2', isOutOfStock && 'opacity-70')}>
      <Link
        onClick={onClick}
        to={`/products/${product.handle}`}
        prefetch="viewport"
      >
        <div className={clsx('grid gap-4', className)}>
          <div className="card-image aspect-[4/5] bg-primary/5 relative overflow-hidden group">
            {firstImage && (
              <Image
                className={clsx(
                  'object-cover w-full fadeIn absolute inset-0 transition-opacity duration-300',
                  secondImage && !isOutOfStock ? 'group-hover:opacity-0' : '',
                  isOutOfStock && 'grayscale',
                )}
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                aspectRatio="4/5"
                data={firstImage}
                alt={firstImage.altText || `Imagem de ${product.title}`}
                loading={loading}
              />
            )}
            {secondImage && !isOutOfStock && (
              <Image
                className="object-cover w-full absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                aspectRatio="4/5"
                data={secondImage}
                alt={secondImage.altText || `Imagem de ${product.title}`}
                loading="lazy"
              />
            )}
            {/* Premium chip — top-left */}
            {isPremium && (
              <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-950 shadow-md ring-1 ring-amber-300/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                    clipRule="evenodd"
                  />
                </svg>
                Premium
              </div>
            )}
            {/* Top-right label (Promoção / Novo) */}
            {cardLabel && (
              <Text
                as="label"
                size="fine"
                className="absolute top-0 right-0 m-4 text-right text-notice z-10"
              >
                {cardLabel}
              </Text>
            )}
            {/* Out of stock badge */}
            {isOutOfStock && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-contrast text-center text-xs font-semibold py-1.5 z-10 uppercase tracking-wide">
                Sem estoque
              </div>
            )}
            {/* Low stock badge */}
            {isLowStock && (
              <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-center text-xs font-semibold py-1.5 z-10">
                Apenas {quantityAvailable} {quantityAvailable === 1 ? 'unidade' : 'unidades'}
              </div>
            )}
          </div>
          <div className="grid gap-1">
            <Text
              className="w-full overflow-hidden whitespace-nowrap text-ellipsis "
              as="h3"
            >
              {product.title}
            </Text>
            <div className="flex gap-4">
              <Text className="flex gap-4">
                <Money withoutTrailingZeros data={price!} />
                {isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) && (
                  <CompareAtPrice
                    className={'opacity-50'}
                    data={compareAtPrice as MoneyV2}
                  />
                )}
              </Text>
            </div>
          </div>
        </div>
      </Link>
      {quickAdd && firstVariant.availableForSale && (
        <AddToCartButton
          lines={[
            {
              quantity: 1,
              merchandiseId: firstVariant.id,
              selectedVariant: firstVariant,
            },
          ]}
          variant="secondary"
          className="mt-2"
        >
          <Text as="span" className="flex items-center justify-center gap-2">
            Adicionar ao Carrinho
          </Text>
        </AddToCartButton>
      )}
      {quickAdd && !firstVariant.availableForSale && (
        <Button variant="secondary" className="mt-2" disabled>
          <Text as="span" className="flex items-center justify-center gap-2">
            Esgotado
          </Text>
        </Button>
      )}
    </div>
  );
}

function CompareAtPrice({
  data,
  className,
}: {
  data: MoneyV2;
  className?: string;
}) {
  const {currencyNarrowSymbol, withoutTrailingZerosAndCurrency} =
    useMoney(data);

  const styles = clsx('strike', className);

  return (
    <span className={styles}>
      {currencyNarrowSymbol}
      {withoutTrailingZerosAndCurrency}
    </span>
  );
}
