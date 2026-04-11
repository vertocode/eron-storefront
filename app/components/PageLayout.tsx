import {useParams, Form, Await, useRouteLoaderData} from '@remix-run/react';

// Logo URLs — hosted on Shopify CDN
const LOGO_NORMAL =
  'https://cdn.shopify.com/s/files/1/0800/2964/7069/files/logo-2-nobg.png?v=1766192249';
const LOGO_INVERSE =
  'https://cdn.shopify.com/s/files/1/0800/2964/7069/files/logo-inverse-3-removebg-preview.png?v=1766192097';
import useWindowScroll from 'react-use/esm/useWindowScroll';
import {Disclosure} from '@headlessui/react';
import {Suspense, useEffect, useMemo, useState} from 'react';
import {CartForm} from '@shopify/hydrogen';

import {type LayoutQuery} from 'storefrontapi.generated';
import {Text, Heading, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Cart} from '~/components/Cart';
import {CartLoading} from '~/components/CartLoading';
import {Input} from '~/components/Input';
import {Drawer, useDrawer} from '~/components/Drawer';
import {
  IconMenu,
  IconLogin,
  IconAccount,
  IconBag,
  IconSearch,
} from '~/components/Icon';
import {
  type EnhancedMenu,
  type ChildEnhancedMenuItem,
  useIsHomePath,
} from '~/lib/utils';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import type {RootLoader, AnnouncementBar} from '~/root';
import type {DiscountTier} from '~/lib/admin-inventory.server';

type LayoutProps = {
  children: React.ReactNode;
  layout?: LayoutQuery & {
    headerMenu?: EnhancedMenu | null;
    footerMenu?: EnhancedMenu | null;
    announcementBars?: AnnouncementBar[];
  };
};

/** Cycles through multiple announcement bars with a fade animation. */
function AnnouncementBarBand({bars}: {bars: AnnouncementBar[]}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (bars.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % bars.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, [bars.length]);

  const bar = bars[index];
  if (!bar) return null;

  const style: React.CSSProperties = {
    backgroundColor: bar.bgColor ?? '#000',
    color: bar.textColor ?? '#fff',
  };

  const isAbsolute = bar.link?.startsWith('http');

  return (
    <div
      style={style}
      className={`w-full py-2.5 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {bar.link ? (
        isAbsolute ? (
          <a href={bar.link} className="block hover:opacity-80 transition-opacity">
            <p className="text-xs sm:text-sm font-medium text-center px-4 leading-snug">{bar.message}</p>
          </a>
        ) : (
          <Link to={bar.link} className="block hover:opacity-80 transition-opacity">
            <p className="text-xs sm:text-sm font-medium text-center px-4 leading-snug">{bar.message}</p>
          </Link>
        )
      ) : (
        <p className="text-xs sm:text-sm font-medium text-center px-4 leading-snug">{bar.message}</p>
      )}
    </div>
  );
}

export function PageLayout({children, layout}: LayoutProps) {
  const {headerMenu, footerMenu, announcementBars = []} = layout || {};
  const globalBars = announcementBars.filter(
    (b) => b.placement === 'global' || b.placement === 'both',
  );
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <a href="#mainContent" className="sr-only">
          Ir para o conteúdo
        </a>
        {globalBars.length > 0 && <AnnouncementBarBand bars={globalBars} />}
        {headerMenu && layout?.shop.name && (
          <Header title={layout.shop.name} menu={headerMenu} footerMenu={footerMenu ?? undefined} />
        )}
        <main role="main" id="mainContent" className="flex-grow">
          {children}
        </main>
      </div>
      {footerMenu && <Footer menu={footerMenu} />}
    </>
  );
}

function Header({title, menu, footerMenu}: {title: string; menu?: EnhancedMenu; footerMenu?: EnhancedMenu}) {
  const isHome = useIsHomePath();

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);

  // toggle cart drawer when adding to cart
  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      {menu && (
        <MenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} footerMenu={footerMenu} />
      )}
      <DesktopHeader
        isHome={isHome}
        menu={menu}
        openCart={openCart}
      />
      <MobileHeader
        isHome={isHome}
        openCart={openCart}
        openMenu={openMenu}
      />
    </>
  );
}

/** Renders a single cart announcement bar. */
function CartAnnouncementBar({bar}: {bar: AnnouncementBar}) {
  const isAbs = bar.link?.startsWith('http');
  const inner = <p className="text-xs font-medium text-center">{bar.message}</p>;
  return (
    <div
      style={{backgroundColor: bar.bgColor ?? '#16a34a', color: bar.textColor ?? '#fff'}}
      className="py-2.5 px-4 transition-all duration-500"
    >
      {bar.link ? (
        isAbs ? (
          <a href={bar.link} className="block hover:opacity-80 transition-opacity">{inner}</a>
        ) : (
          <Link to={bar.link} className="block hover:opacity-80 transition-opacity">{inner}</Link>
        )
      ) : inner}
    </div>
  );
}

/** Builds the smart discount tier message for the cart drawer. */
function discountTierMessage(totalQty: number, tiers: DiscountTier[]): {message: string; bg: string} | null {
  if (!tiers.length) return null;

  // Find current tier (highest minQuantity <= totalQty)
  const currentTier = [...tiers].reverse().find((t) => totalQty >= t.minQuantity) ?? null;
  // Find next tier (lowest minQuantity > totalQty)
  const nextTier = tiers.find((t) => totalQty < t.minQuantity) ?? null;

  if (!currentTier && nextTier) {
    // Haven't reached any tier yet
    const need = nextTier.minQuantity - totalQty;
    return {
      message: `✂️ Adicione mais ${need} ${need === 1 ? 'peça' : 'peças'} e ganhe ${Math.round(nextTier.percentage * 100)}% de desconto!`,
      bg: '#16a34a',
    };
  }

  if (currentTier && nextTier) {
    // On a tier, show the next one
    const need = nextTier.minQuantity - totalQty;
    return {
      message: `✅ ${Math.round(currentTier.percentage * 100)}% de desconto aplicado! Adicione mais ${need} ${need === 1 ? 'peça' : 'peças'} para ${Math.round(nextTier.percentage * 100)}% de desconto!`,
      bg: '#15803d',
    };
  }

  if (currentTier && !nextTier) {
    // On the highest tier
    return {
      message: `🎉 ${Math.round(currentTier.percentage * 100)}% de desconto aplicado — você atingiu o desconto máximo!`,
      bg: '#15803d',
    };
  }

  return null;
}

function CartDrawer({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Drawer open={isOpen} onClose={onClose} heading="Carrinho" openFrom="right">
      <div className="grid grid-rows-[auto_1fr] h-[calc(100%-var(--height-nav))] overflow-hidden">
        <Suspense fallback={<CartLoading />}>
          <Await
            resolve={rootData?.cart}
            errorElement={
              <div className="p-6 text-center text-sm text-primary/60">
                Erro ao carregar o carrinho. Tente novamente.
              </div>
            }
          >
            {(cart) => (
              <Suspense fallback={<Cart layout="drawer" onClose={onClose} cart={cart} />}>
                <Await resolve={(rootData as any)?.discountTiers}>
                  {(tiers: DiscountTier[]) => {
                    const totalQty = cart?.totalQuantity ?? 0;
                    const tierMsg = totalQty > 0 ? discountTierMessage(totalQty, tiers ?? []) : null;
                    return (
                      <>
                        {tierMsg && (
                          <div
                            style={{backgroundColor: tierMsg.bg, color: '#fff'}}
                            className="py-2.5 px-4 shrink-0"
                          >
                            <p className="text-xs font-medium text-center">{tierMsg.message}</p>
                          </div>
                        )}
                        <Cart layout="drawer" onClose={onClose} cart={cart} />
                      </>
                    );
                  }}
                </Await>
              </Suspense>
            )}
          </Await>
        </Suspense>
      </div>
    </Drawer>
  );
}

export function MenuDrawer({
  isOpen,
  onClose,
  menu,
  footerMenu,
}: {
  isOpen: boolean;
  onClose: () => void;
  menu: EnhancedMenu;
  footerMenu?: EnhancedMenu;
}) {
  return (
    <Drawer open={isOpen} onClose={onClose} openFrom="left" heading="Menu">
      <div className="grid">
        <MenuMobileNav menu={menu} footerMenu={footerMenu} onClose={onClose} />
      </div>
    </Drawer>
  );
}

function MenuMobileNav({
  menu,
  footerMenu,
  onClose,
}: {
  menu: EnhancedMenu;
  footerMenu?: EnhancedMenu;
  onClose: () => void;
}) {
  // Collect all sub-items from footer "Páginas" sections (items with children)
  const pageLinks = (footerMenu?.items || [])
    .filter((item) => item.items?.length > 0)
    .flatMap((item) => item.items);

  return (
    <nav className="grid gap-4 p-6 sm:gap-6 sm:px-12 sm:py-8">
      {/* Main nav links */}
      {(menu?.items || []).map((item) => (
        <span key={item.id} className="block">
          <Link
            to={item.to}
            target={item.target}
            onClick={onClose}
            className={({isActive}) =>
              isActive ? 'pb-1 border-b -mb-px' : 'pb-1'
            }
          >
            <Text as="span" size="copy">
              {item.title}
            </Text>
          </Link>
        </span>
      ))}

      {/* Footer page links */}
      {pageLinks.length > 0 && (
        <>
          <div className="border-t border-primary/10 pt-4 mt-2">
            <Text as="p" size="fine" className="uppercase tracking-widest text-primary/40 mb-3">
              Páginas
            </Text>
            {pageLinks.map((item) => (
              <span key={item.id} className="block mb-3">
                <Link
                  to={item.to}
                  target={item.target}
                  onClick={onClose}
                  className={({isActive}) =>
                    isActive
                      ? 'pb-1 border-b -mb-px text-primary/60'
                      : 'pb-1 text-primary/60 hover:text-primary transition-colors'
                  }
                >
                  <Text as="span" size="copy">
                    {item.title}
                  </Text>
                </Link>
              </span>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}

function MobileHeader({
  isHome,
  openCart,
  openMenu,
}: {
  isHome: boolean;
  openCart: () => void;
  openMenu: () => void;
}) {
  // useHeaderStyleFix(containerStyle, setContainerStyle, isHome);

  const params = useParams();

  return (
    <header
      role="banner"
      className="bg-contrast/80 text-primary flex lg:hidden items-center h-nav sticky backdrop-blur-lg z-40 top-0 justify-between w-full leading-none gap-4 px-4 md:px-8"
    >
      <div className="flex items-center justify-start w-full gap-4">
        <button
          onClick={openMenu}
          className="relative flex items-center justify-center w-8 h-8"
        >
          <IconMenu />
        </button>
        <Form
          method="get"
          action={params.locale ? `/${params.locale}/search` : '/search'}
          className="items-center gap-2 sm:flex"
        >
          <button
            type="submit"
            className="relative flex items-center justify-center w-8 h-8"
          >
            <IconSearch />
          </button>
          <Input
            className="focus:border-primary/20"
            type="search"
            variant="minisearch"
            placeholder="Buscar"
            name="q"
          />
        </Form>
      </div>

      <Link
        className="flex items-center self-stretch justify-center flex-grow w-full h-full"
        to="/"
      >
        <img
          src={LOGO_NORMAL}
          alt="Eron Fit"
          className="h-7 w-auto object-contain"
        />
      </Link>

      <div className="flex items-center justify-end w-full gap-4">
        <AccountLink className="relative flex items-center justify-center w-8 h-8" />
        <CartCount isHome={false} openCart={openCart} />
      </div>
    </header>
  );
}

function DesktopHeader({
  isHome,
  menu,
  openCart,
}: {
  isHome: boolean;
  openCart: () => void;
  menu?: EnhancedMenu;
}) {
  const params = useParams();
  const {y} = useWindowScroll();
  return (
    <header
      role="banner"
      className={`bg-contrast/80 text-primary${y > 50 ? ' shadow-lightHeader' : ''} hidden h-nav lg:flex items-center sticky transition duration-300 backdrop-blur-lg z-40 top-0 justify-between w-full leading-none gap-8 px-12 py-8`}
    >
      <div className="flex items-center gap-12">
        <Link className="flex items-center" to="/" prefetch="intent">
          <img
            src={LOGO_NORMAL}
            alt="Eron Fit"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center gap-8">
          {/* Top level menu items */}
          {(menu?.items || []).map((item) => (
            <Link
              key={item.id}
              to={item.to}
              target={item.target}
              prefetch="intent"
              className={({isActive}) =>
                isActive ? 'pb-1 border-b -mb-px' : 'pb-1'
              }
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <Form
          method="get"
          action={params.locale ? `/${params.locale}/search` : '/search'}
          className="flex items-center gap-2"
        >
          <Input
            className="focus:border-primary/20"
            type="search"
            variant="minisearch"
            placeholder="Buscar"
            name="q"
          />
          <button
            type="submit"
            className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5"
          >
            <IconSearch />
          </button>
        </Form>
        <AccountLink className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5" />
        <CartCount isHome={false} openCart={openCart} />
      </div>
    </header>
  );
}

function AccountLink({className}: {className?: string}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link to="/account" className={className}>
      <Suspense fallback={<IconLogin />}>
        <Await resolve={isLoggedIn} errorElement={<IconLogin />}>
          {(isLoggedIn) => (isLoggedIn ? <IconAccount /> : <IconLogin />)}
        </Await>
      </Suspense>
    </Link>
  );
}

function CartCount({
  isHome,
  openCart,
}: {
  isHome: boolean;
  openCart: () => void;
}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={<Badge count={0} dark={isHome} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Badge
            dark={isHome}
            openCart={openCart}
            count={cart?.totalQuantity || 0}
          />
        )}
      </Await>
    </Suspense>
  );
}

function Badge({
  openCart,
  dark,
  count,
}: {
  count: number;
  dark: boolean;
  openCart: () => void;
}) {
  const isHydrated = useIsHydrated();

  const BadgeCounter = useMemo(
    () => (
      <>
        <IconBag />
        <div
          className={`${
            dark
              ? 'text-primary bg-contrast dark:text-contrast dark:bg-primary'
              : 'text-contrast bg-primary'
          } absolute bottom-1 right-1 text-[0.625rem] font-medium subpixel-antialiased h-3 min-w-[0.75rem] flex items-center justify-center leading-none text-center rounded-full w-auto px-[0.125rem] pb-px`}
        >
          <span>{count || 0}</span>
        </div>
      </>
    ),
    [count, dark],
  );

  return isHydrated ? (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5"
    >
      {BadgeCounter}
    </button>
  ) : (
    <Link
      to="/cart"
      className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5"
    >
      {BadgeCounter}
    </Link>
  );
}

function Footer({menu}: {menu?: EnhancedMenu}) {
  const isHome = useIsHomePath();
  const itemsCount = menu
    ? menu?.items?.length > 4
      ? 4
      : menu?.items?.length
    : [];

  return (
    <Section
      divider={isHome ? 'none' : 'top'}
      as="footer"
      role="contentinfo"
      className={`grid min-h-[25rem] items-start grid-flow-row w-full gap-6 py-8 px-6 md:px-8 lg:px-12 md:gap-8 lg:gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-${itemsCount}
        bg-primary dark:bg-contrast dark:text-primary text-contrast overflow-hidden`}
    >
      {/* Logo — spans full width above menu columns */}
      <div className={`md:col-span-2 lg:col-span-${itemsCount} pb-2`}>
        <Link to="/">
          <img
            src={LOGO_INVERSE}
            alt="Eron Fit"
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>
      <FooterMenu menu={menu} />
      <div
        className={`self-end pt-8 opacity-50 md:col-span-2 lg:col-span-${itemsCount}`}
      >
        &copy; {new Date().getFullYear()} Eron Fit. Todos os direitos reservados.
      </div>
    </Section>
  );
}

function FooterLink({item}: {item: ChildEnhancedMenuItem}) {
  const className = 'text-contrast/60 dark:text-primary/60 hover:text-contrast dark:hover:text-primary transition-colors';

  if (item.to.startsWith('http')) {
    return (
      <a href={item.to} target={item.target} rel="noopener noreferrer" className={className}>
        {item.title}
      </a>
    );
  }

  return (
    <Link to={item.to} target={item.target} prefetch="intent" className={className}>
      {item.title}
    </Link>
  );
}

function FooterSearch() {
  const params = useParams();
  return (
    <Form
      method="get"
      action={params.locale ? `/${params.locale}/search` : '/search'}
      className="flex items-center gap-2 mt-2"
    >
      <Input
        type="search"
        variant="minisearch"
        placeholder="Buscar..."
        name="q"
        className="!block w-full focus:border-contrast/20 dark:focus:border-primary/20 !text-left"
      />
      <button
        type="submit"
        className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5 flex-shrink-0"
        aria-label="Buscar"
      >
        <IconSearch />
      </button>
    </Form>
  );
}

function FooterMenu({menu}: {menu?: EnhancedMenu}) {
  const styles = {
    section: 'grid gap-4',
    nav: 'grid gap-2 pb-6',
  };

  return (
    <>
      {(menu?.items || []).map((item) => {
        const isSearch = item.title.toLowerCase() === 'busca' || item.title.toLowerCase() === 'search';
        return (
          <section key={item.id} className={styles.section}>
            <Disclosure>
              {() => (
                <>
                  <Disclosure.Button className="text-left cursor-default" as="div">
                    <Heading className="flex justify-between" size="lead" as="h3">
                      {item.title}
                    </Heading>
                  </Disclosure.Button>
                  {isSearch ? (
                    <FooterSearch />
                  ) : item?.items?.length > 0 ? (
                    <nav className={styles.nav}>
                      {item.items.map((subItem: ChildEnhancedMenuItem) => (
                        <FooterLink key={subItem.id} item={subItem} />
                      ))}
                    </nav>
                  ) : null}
                </>
              )}
            </Disclosure>
          </section>
        );
      })}
    </>
  );
}
