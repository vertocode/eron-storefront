import clsx from 'clsx';

import {StarRating} from '~/components/StarRating';
import type {ProductReview} from '~/lib/reviews';
import {getReviewsAverage} from '~/lib/reviews';

export const REVIEWS_SECTION_ID = 'reviews';

export function ReviewSummary({
  reviews,
  className,
}: {
  reviews: ProductReview[];
  className?: string;
}) {
  if (reviews.length === 0) return null;
  const avg = getReviewsAverage(reviews);
  const count = reviews.length;
  const label = count === 1 ? 'avaliação' : 'avaliações';

  return (
    <a
      href={`#${REVIEWS_SECTION_ID}`}
      className={clsx(
        'group inline-flex items-center gap-2 -mt-1 mb-1 text-sm text-primary/70 hover:text-primary transition-colors',
        className,
      )}
      aria-label={`Ver ${count} ${label}, média ${avg.toFixed(1)} de 5`}
    >
      <StarRating value={avg} size="sm" />
      <span className="font-medium tabular-nums">{avg.toFixed(1)}</span>
      <span className="opacity-70 group-hover:underline">
        ({count} {label})
      </span>
    </a>
  );
}

export function ReviewsSection({reviews}: {reviews: ProductReview[]}) {
  if (reviews.length === 0) return null;
  const avg = getReviewsAverage(reviews);
  const count = reviews.length;
  const label = count === 1 ? 'avaliação' : 'avaliações';

  return (
    <section
      id={REVIEWS_SECTION_ID}
      className="px-6 md:px-8 lg:px-12 py-12 border-t border-primary/10 scroll-mt-24"
      aria-labelledby="reviews-heading"
    >
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2
              id="reviews-heading"
              className="text-2xl md:text-3xl font-semibold"
            >
              Avaliações
            </h2>
            <p className="text-primary/60 text-sm mt-1">
              {count} {label} de quem comprou
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl md:text-4xl font-semibold tabular-nums">
              {avg.toFixed(1)}
            </span>
            <div className="flex flex-col gap-1">
              <StarRating value={avg} size="lg" />
              <span className="text-xs text-primary/60">de 5 estrelas</span>
            </div>
          </div>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReviewCard({review}: {review: ProductReview}) {
  return (
    <article className="rounded-lg border border-primary/10 bg-contrast p-5 flex flex-col gap-2 h-full">
      <header className="flex items-center justify-between gap-3">
        <StarRating value={review.rating} size="sm" />
        {review.date && (
          <time
            dateTime={review.date}
            className="text-xs text-primary/50 tabular-nums"
          >
            {formatReviewDate(review.date)}
          </time>
        )}
      </header>
      {review.title && (
        <h3 className="font-semibold text-base leading-snug">{review.title}</h3>
      )}
      {review.body && (
        <p className="text-sm text-primary/80 leading-relaxed whitespace-pre-line">
          {review.body}
        </p>
      )}
      <footer className="mt-auto pt-3 flex items-center gap-2 text-xs text-primary/60">
        <span className="font-medium text-primary/80">{review.author}</span>
        {review.verified && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.07 7.142a1 1 0 0 1-1.418.005L3.29 8.928a1 1 0 1 1 1.42-1.41l4.224 4.252 6.357-6.42a1 1 0 0 1 1.413-.06Z"
                clipRule="evenodd"
              />
            </svg>
            <span>Compra verificada</span>
          </span>
        )}
      </footer>
    </article>
  );
}

function formatReviewDate(iso: string): string {
  // ISO date e.g. 2025-12-04. Format using pt-BR locale.
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
