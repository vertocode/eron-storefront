export type ProductReview = {
  id: string;
  rating: number;
  author: string;
  title?: string;
  body?: string;
  date?: string;
  verified?: boolean;
};

type RawMetaobjectField = {key: string; value: string};
type RawMetaobject = {id: string; fields: RawMetaobjectField[]};

type RawReviewsMetafield =
  | null
  | undefined
  | {references?: {nodes?: Array<RawMetaobject | null | undefined>} | null};

export function parseProductReviews(
  metafield: RawReviewsMetafield,
): ProductReview[] {
  const nodes = metafield?.references?.nodes ?? [];
  const reviews: ProductReview[] = [];

  for (const node of nodes) {
    if (!node?.id) continue;
    const fields = new Map(node.fields.map((f) => [f.key, f.value] as const));
    const ratingRaw = fields.get('rating');
    const author = fields.get('author')?.trim();
    if (!author || !ratingRaw) continue;
    const rating = clamp(parseFloat(ratingRaw), 0, 5);
    if (Number.isNaN(rating)) continue;
    reviews.push({
      id: node.id,
      rating,
      author,
      title: fields.get('title')?.trim() || undefined,
      body: fields.get('body')?.trim() || undefined,
      date: fields.get('date')?.trim() || undefined,
      verified: fields.get('verified') === 'true',
    });
  }

  // Most recent first (when date is provided), then by rating descending.
  reviews.sort((a, b) => {
    if (a.date && b.date) {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
    } else if (a.date) {
      return -1;
    } else if (b.date) {
      return 1;
    }
    return b.rating - a.rating;
  });

  return reviews;
}

export function getReviewsAverage(reviews: ProductReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
