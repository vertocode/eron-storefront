import type {SyntheticEvent} from 'react';
import {useMemo, useState} from 'react';
import {Menu, Disclosure} from '@headlessui/react';
import type {Location} from '@remix-run/react';
import {
  Link,
  useLocation,
  useSearchParams,
  useNavigate,
} from '@remix-run/react';
import useDebounce from 'react-use/esm/useDebounce';
import type {
  Filter,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';

import clsx from 'clsx';

import {Heading, Text} from '~/components/Text';
import {IconFilters, IconCaret} from '~/components/Icon';

export type AppliedFilter = {
  label: string;
  filter: ProductFilter;
};

export type SortParam =
  | 'price-low-high'
  | 'price-high-low'
  | 'best-selling'
  | 'newest'
  | 'featured';

type Props = {
  filters: Filter[];
  appliedFilters?: AppliedFilter[];
  children: React.ReactNode;
  collections?: Array<{handle: string; title: string}>;
};
export const FILTER_URL_PREFIX = 'filter.';

export function SortFilter({
  filters,
  appliedFilters = [],
  children,
  collections = [],
}: Props) {
  // Mobile-only toggle. Desktop (md+) always shows the panel via CSS.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setIsMobileOpen((v) => !v)}
          className="md:hidden relative inline-flex items-center gap-2 px-3 h-9 rounded border border-primary/15 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          aria-expanded={isMobileOpen}
          aria-controls="plp-filters-panel"
        >
          <IconFilters />
          <span className="text-sm font-medium">Filtros</span>
        </button>
        <span className="hidden md:inline-flex items-center gap-2 px-3 h-9 text-sm font-medium text-primary/80">
          <IconFilters />
          Filtros
        </span>
        <SortMenu />
      </div>
      <div className="flex flex-col flex-wrap md:flex-row">
        <div
          id="plp-filters-panel"
          className={`transition-all duration-200 overflow-hidden md:opacity-100 md:min-w-[240px] md:w-[240px] md:pr-8 md:max-h-full ${
            isMobileOpen
              ? 'opacity-100 min-w-full max-h-full'
              : 'opacity-0 max-h-0 pr-0'
          }`}
        >
          <FiltersDrawer filters={filters} appliedFilters={appliedFilters} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}

export function FiltersDrawer({
  filters = [],
  appliedFilters = [],
}: Omit<Props, 'children'>) {
  const [params] = useSearchParams();
  const location = useLocation();

  const isOptionSelected = (
    filter: Filter,
    option: Filter['values'][0],
  ): boolean => {
    if (filter.type === 'PRICE_RANGE') return false;
    let optionFilter: ProductFilter;
    try {
      optionFilter = JSON.parse(option.input as string) as ProductFilter;
    } catch {
      return false;
    }
    return appliedFilters.some(
      (af) => JSON.stringify(af.filter) === JSON.stringify(optionFilter),
    );
  };

  const filterMarkup = (filter: Filter, option: Filter['values'][0]) => {
    switch (filter.type) {
      case 'PRICE_RANGE': {
        const priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
        const price = priceFilter
          ? (JSON.parse(priceFilter) as ProductFilter['price'])
          : undefined;
        const min = isNaN(Number(price?.min)) ? undefined : Number(price?.min);
        const max = isNaN(Number(price?.max)) ? undefined : Number(price?.max);
        return <PriceRangeFilter min={min} max={max} />;
      }
      default: {
        const selected = isOptionSelected(filter, option);
        const to = selected
          ? getRemoveFilterLink(option.input as string, params, location)
          : getFilterLink(option.input as string, params, location);
        return (
          <Link
            prefetch="intent"
            to={to}
            aria-pressed={selected}
            className={clsx(
              'inline-flex items-center justify-center min-w-[2.5rem] px-3 h-9 rounded border text-sm transition-colors',
              selected
                ? 'bg-primary text-contrast border-primary'
                : 'border-primary/15 hover:border-primary/50',
            )}
          >
            {option.label}
          </Link>
        );
      }
    }
  };

  return (
    <>
      <nav className="py-8">
        <Heading as="h4" size="lead" className="pb-4">
          Filtrar Por
        </Heading>
        <div className="divide-y">
          {filters.map((filter: Filter) => (
            <Disclosure
              as="div"
              key={filter.id}
              className="w-full"
              defaultOpen
            >
              {({open}) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full py-4">
                    <Text size="lead">{filter.label}</Text>
                    <IconCaret direction={open ? 'up' : 'down'} />
                  </Disclosure.Button>
                  <Disclosure.Panel>
                    <ul className="pb-4 flex flex-wrap gap-2">
                      {filter.values?.map((option) => (
                        <li key={option.id}>{filterMarkup(filter, option)}</li>
                      ))}
                    </ul>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </nav>
    </>
  );
}

function getSortLink(
  sort: SortParam,
  params: URLSearchParams,
  location: Location,
) {
  params.set('sort', sort);
  params.delete('cursor');
  params.delete('direction');
  return `${location.pathname}?${params.toString()}`;
}

function getFilterLink(
  rawInput: string | ProductFilter,
  params: URLSearchParams,
  location: ReturnType<typeof useLocation>,
) {
  const paramsClone = new URLSearchParams(params);
  const newParams = filterInputToParams(rawInput, paramsClone);
  newParams.delete('cursor');
  newParams.delete('direction');
  return `${location.pathname}?${newParams.toString()}`;
}

function getRemoveFilterLink(
  rawInput: string | ProductFilter,
  params: URLSearchParams,
  location: ReturnType<typeof useLocation>,
) {
  const input =
    typeof rawInput === 'string'
      ? (JSON.parse(rawInput) as ProductFilter)
      : rawInput;
  const paramsClone = new URLSearchParams(params);
  Object.entries(input).forEach(([key, value]) => {
    paramsClone.delete(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value));
  });
  paramsClone.delete('cursor');
  paramsClone.delete('direction');
  return `${location.pathname}?${paramsClone.toString()}`;
}

const PRICE_RANGE_FILTER_DEBOUNCE = 500;

function PriceRangeFilter({max, min}: {max?: number; min?: number}) {
  const location = useLocation();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  useDebounce(
    () => {
      if (minPrice === undefined && maxPrice === undefined) {
        params.delete(`${FILTER_URL_PREFIX}price`);
        navigate(`${location.pathname}?${params.toString()}`);
        return;
      }

      const price = {
        ...(minPrice === undefined ? {} : {min: minPrice}),
        ...(maxPrice === undefined ? {} : {max: maxPrice}),
      };
      const newParams = filterInputToParams({price}, params);
      navigate(`${location.pathname}?${newParams.toString()}`);
    },
    PRICE_RANGE_FILTER_DEBOUNCE,
    [minPrice, maxPrice],
  );

  const onChangeMax = (event: SyntheticEvent) => {
    const value = (event.target as HTMLInputElement).value;
    const newMaxPrice = Number.isNaN(parseFloat(value))
      ? undefined
      : parseFloat(value);
    setMaxPrice(newMaxPrice);
  };

  const onChangeMin = (event: SyntheticEvent) => {
    const value = (event.target as HTMLInputElement).value;
    const newMinPrice = Number.isNaN(parseFloat(value))
      ? undefined
      : parseFloat(value);
    setMinPrice(newMinPrice);
  };

  return (
    <div className="flex flex-col">
      <label className="mb-4">
        <span>de</span>
        <input
          name="minPrice"
          className="text-black"
          type="number"
          value={minPrice ?? ''}
          placeholder={'$'}
          onChange={onChangeMin}
        />
      </label>
      <label>
        <span>até</span>
        <input
          name="maxPrice"
          className="text-black"
          type="number"
          value={maxPrice ?? ''}
          placeholder={'$'}
          onChange={onChangeMax}
        />
      </label>
    </div>
  );
}

function filterInputToParams(
  rawInput: string | ProductFilter,
  params: URLSearchParams,
) {
  const input =
    typeof rawInput === 'string'
      ? (JSON.parse(rawInput) as ProductFilter)
      : rawInput;

  Object.entries(input).forEach(([key, value]) => {
    if (params.has(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value))) {
      return;
    }
    if (key === 'price') {
      // For price, we want to overwrite
      params.set(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value));
    } else {
      params.append(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value));
    }
  });

  return params;
}

export default function SortMenu() {
  const items: {label: string; key: SortParam}[] = [
    {label: 'Destaques', key: 'featured'},
    {
      label: 'Preço: Menor - Maior',
      key: 'price-low-high',
    },
    {
      label: 'Preço: Maior - Menor',
      key: 'price-high-low',
    },
    {
      label: 'Mais Vendidos',
      key: 'best-selling',
    },
    {
      label: 'Mais Recentes',
      key: 'newest',
    },
  ];
  const [params] = useSearchParams();
  const location = useLocation();
  const activeItem = items.find((item) => item.key === params.get('sort'));

  return (
    <Menu as="div" className="relative z-40">
      <Menu.Button className="flex items-center">
        <span className="px-2">
          <span className="px-2 font-medium">Ordenar por:</span>
          <span>{(activeItem || items[0]).label}</span>
        </span>
        <IconCaret />
      </Menu.Button>

      <Menu.Items
        as="nav"
        className="absolute right-0 flex flex-col p-4 text-right rounded-sm bg-contrast"
      >
        {items.map((item) => (
          <Menu.Item key={item.label}>
            {() => (
              <Link
                className={`block text-sm pb-2 px-3 ${
                  activeItem?.key === item.key ? 'font-bold' : 'font-normal'
                }`}
                to={getSortLink(item.key, params, location)}
              >
                {item.label}
              </Link>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
}
