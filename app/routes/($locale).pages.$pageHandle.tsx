import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import invariant from 'tiny-invariant';
import {getSeoMeta} from '@shopify/hydrogen';

import {PageHeader} from '~/components/Text';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';

export const headers = routeHeaders;

type CookieEntry = {
  name: string;
  category: string;
  purpose: string;
  duration: string;
  source: string;
  sort_order: number;
};

function buildCookieTable(cookies: CookieEntry[]): string {
  const categoryColor: Record<string, string> = {
    'Essencial': '#d1fae5',
    'Analítico': '#dbeafe',
    'Marketing': '#fce7f3',
    'Preferências': '#fef3c7',
  };

  const rows = cookies.map((c, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    const catBg = categoryColor[c.category] || '#f3f4f6';
    return `<tr style="background:${bg}">
      <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:monospace;font-size:0.85em;white-space:nowrap">${c.name}</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb"><span style="background:${catBg};padding:2px 8px;border-radius:12px;font-size:0.8em;font-weight:600;white-space:nowrap">${c.category}</span></td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;font-size:0.9em;line-height:1.5">${c.purpose}</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;font-size:0.9em;white-space:nowrap">${c.duration}</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;font-size:0.85em;color:#6b7280">${c.source}</td>
    </tr>`;
  });

  return `<div style="overflow-x:auto;margin:1.5rem 0">
  <table style="width:100%;border-collapse:collapse;font-size:0.9em;min-width:600px">
    <thead>
      <tr style="background:#111827;color:#ffffff">
        <th style="padding:12px;text-align:left;border:1px solid #374151">Cookie</th>
        <th style="padding:12px;text-align:left;border:1px solid #374151">Categoria</th>
        <th style="padding:12px;text-align:left;border:1px solid #374151">Finalidade</th>
        <th style="padding:12px;text-align:left;border:1px solid #374151">Duração</th>
        <th style="padding:12px;text-align:left;border:1px solid #374151">Origem</th>
      </tr>
    </thead>
    <tbody>${rows.join('\n')}</tbody>
  </table>
</div>`;
}

export async function loader({request, params, context}: LoaderFunctionArgs) {
  invariant(params.pageHandle, 'Missing page handle');

  const isCookiePolicy = params.pageHandle === 'politica-de-cookies';

  const [{page}, cookieData] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.pageHandle,
        language: context.storefront.i18n.language,
      },
    }),
    isCookiePolicy
      ? context.storefront.query(COOKIE_ENTRIES_QUERY, {
          variables: {language: context.storefront.i18n.language},
        })
      : Promise.resolve(null),
  ]);

  if (!page) {
    throw new Response(null, {status: 404});
  }

  let body = page.body as string;

  if (isCookiePolicy && cookieData) {
    const raw: any[] = (cookieData as any)?.metaobjects?.nodes ?? [];
    const entries: CookieEntry[] = raw
      .map((node: any) => {
        const fields = Object.fromEntries(
          node.fields.map((f: any) => [f.key, f.value]),
        );
        return {
          name: fields.name ?? '',
          category: fields.category ?? '',
          purpose: fields.purpose ?? '',
          duration: fields.duration ?? '',
          source: fields.source ?? '',
          sort_order: parseInt(fields.sort_order ?? '99', 10),
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    if (entries.length > 0) {
      body = body.replace('<!--COOKIES_TABLE-->', buildCookieTable(entries));
    }
  }

  const seo = seoPayload.page({page, url: request.url});

  return json({page: {...page, body}, seo});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading={page.title}>
        <div
          dangerouslySetInnerHTML={{__html: page.body}}
          className="prose dark:prose-invert max-w-none"
        />
      </PageHeader>
    </>
  );
}

const PAGE_QUERY = `#graphql
  query PageDetails($language: LanguageCode, $handle: String!)
  @inContext(language: $language) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
`;

const COOKIE_ENTRIES_QUERY = `#graphql
  query CookieEntries($language: LanguageCode)
  @inContext(language: $language) {
    metaobjects(type: "cookie_entry", first: 50) {
      nodes {
        fields {
          key
          value
        }
      }
    }
  }
`;
