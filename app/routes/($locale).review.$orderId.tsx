import {useState} from 'react';
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Form, useActionData, useLoaderData, useNavigation} from '@remix-run/react';

import {PageHeader, Section, Text, Heading} from '~/components/Text';
import {StarRating} from '~/components/StarRating';
import {Button} from '~/components/Button';
import {
  getOrderForReview,
  submitReview,
  type OrderForReview,
} from '~/lib/admin-reviews.server';

export async function loader({params, context}: LoaderFunctionArgs) {
  const {orderId} = params;
  if (!orderId || !/^\d+$/.test(orderId)) {
    throw new Response('Invalid order id', {status: 404});
  }
  const order = await getOrderForReview(context.env, orderId);
  if (!order) {
    throw new Response('Order not found', {status: 404});
  }
  return json({order});
}

type ActionResult =
  | {ok: true; submittedProductIds: string[]}
  | {ok: false; error: string};

export async function action({request, params, context}: ActionFunctionArgs) {
  const {orderId} = params;
  if (!orderId || !/^\d+$/.test(orderId)) {
    return json({ok: false, error: 'Pedido inválido.'} satisfies ActionResult, {
      status: 400,
    });
  }
  const order = await getOrderForReview(context.env, orderId);
  if (!order) {
    return json(
      {ok: false, error: 'Pedido não encontrado.'} satisfies ActionResult,
      {status: 404},
    );
  }

  const formData = await request.formData();
  const author =
    String(formData.get('author') ?? '').trim() ||
    order.customerName ||
    'Cliente Eron Fit';

  const submitted: string[] = [];
  for (const li of order.lineItems) {
    const ratingRaw = formData.get(`rating-${li.productId}`);
    const rating = parseInt(String(ratingRaw ?? '0'), 10);
    if (!rating || rating < 1) continue; // line item skipped by user
    const title = String(formData.get(`title-${li.productId}`) ?? '');
    const body = String(formData.get(`body-${li.productId}`) ?? '');
    const result = await submitReview(context.env, {
      orderLegacyId: order.legacyResourceId,
      productId: li.productId,
      productHandle: li.productHandle,
      rating,
      author,
      title,
      body,
    });
    if (!result.ok) {
      return json(
        {ok: false, error: result.error} satisfies ActionResult,
        {status: 500},
      );
    }
    submitted.push(li.productId);
  }

  if (submitted.length === 0) {
    return json(
      {
        ok: false,
        error: 'Selecione uma nota em pelo menos um produto.',
      } satisfies ActionResult,
      {status: 400},
    );
  }

  return redirect(`/review/${orderId}/obrigado`);
}

export default function ReviewForm() {
  const {order} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <PageHeader heading={`Avaliar pedido ${order.name}`}>
        <Text format width="narrow" as="p" className="inline-block">
          Sua opinião ajuda outras mulheres a escolherem com confiança.
          Selecione uma nota e deixe um comentário se quiser. Leva 1 minutinho.
        </Text>
      </PageHeader>
      <Section>
        <Form method="post" className="max-w-2xl mx-auto flex flex-col gap-8">
          <AuthorField defaultValue={order.customerName ?? ''} />

          <ul className="flex flex-col gap-6">
            {order.lineItems.map((li) => (
              <li key={li.productId}>
                <ReviewItemFields item={li} />
              </li>
            ))}
          </ul>

          {actionData && !actionData.ok && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {actionData.error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Text className="text-sm text-primary/60">
              Você pode pular qualquer produto deixando a nota como 0 estrelas.
            </Text>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="rounded-lg py-3 px-6"
            >
              {isSubmitting ? 'Enviando…' : 'Enviar avaliação'}
            </Button>
          </div>
        </Form>
      </Section>
    </>
  );
}

function AuthorField({defaultValue}: {defaultValue: string}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Text className="text-sm font-semibold">Como devemos te chamar?</Text>
      <input
        type="text"
        name="author"
        defaultValue={defaultValue}
        maxLength={80}
        placeholder="Seu nome"
        className="rounded-lg border border-primary/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <Text className="text-xs text-primary/50">
        Aparece publicamente junto da sua avaliação.
      </Text>
    </label>
  );
}

function ReviewItemFields({
  item,
}: {
  item: OrderForReview['lineItems'][number];
}) {
  const [rating, setRating] = useState(0);
  const ratingId = `rating-${item.productId}`;

  return (
    <article className="rounded-xl border border-primary/10 p-5 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        {item.productImage && (
          <img
            src={item.productImage}
            alt=""
            className="w-14 h-14 rounded-md object-cover bg-primary/5"
          />
        )}
        <div className="min-w-0 flex-1">
          <Heading as="h3" size="copy" className="text-base font-semibold">
            {item.productTitle}
          </Heading>
        </div>
      </header>

      <div>
        <Text className="text-sm font-semibold mb-2">Sua nota</Text>
        <StarPicker
          name={ratingId}
          value={rating}
          onChange={setRating}
          ariaLabel={`Nota para ${item.productTitle}`}
        />
      </div>

      {rating > 0 && (
        <>
          <label className="flex flex-col gap-1.5">
            <Text className="text-sm font-semibold">Título (opcional)</Text>
            <input
              type="text"
              name={`title-${item.productId}`}
              maxLength={120}
              placeholder="Ex.: Vesti perfeito!"
              className="rounded-lg border border-primary/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <Text className="text-sm font-semibold">Comentário (opcional)</Text>
            <textarea
              name={`body-${item.productId}`}
              maxLength={2000}
              rows={4}
              placeholder="Conte o que você achou — caimento, tecido, conforto…"
              className="rounded-lg border border-primary/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </label>
        </>
      )}
    </article>
  );
}

function StarPicker({
  name,
  value,
  onChange,
  ariaLabel,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-3" aria-label={ariaLabel}>
      <input type="hidden" name={name} value={value} />
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} de 5 estrelas`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onChange(value === n ? 0 : n)}
            className="p-1 -m-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <StarRating value={n <= display ? 1 : 0} outOf={1} size="lg" />
          </button>
        ))}
      </div>
      {display > 0 && (
        <span className="text-sm text-primary/60 tabular-nums">
          {display} de 5
        </span>
      )}
    </div>
  );
}
