import clsx from 'clsx';

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StarRating({
  value,
  outOf = 5,
  size = 'md',
  className,
  ariaLabel,
}: {
  value: number;
  outOf?: number;
  size?: Size;
  className?: string;
  ariaLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(outOf, value));
  // Width % of the gold-fill overlay (handles fractional stars).
  const widthPct = (clamped / outOf) * 100;
  const sizeClass = SIZE_CLASS[size];

  return (
    <span
      className={clsx('relative inline-flex items-center', className)}
      role="img"
      aria-label={
        ariaLabel ?? `${clamped.toFixed(1)} de ${outOf} estrelas`
      }
    >
      {/* Empty stars (background) */}
      <span aria-hidden="true" className="flex">
        {Array.from({length: outOf}).map((_, i) => (
          <Star key={`bg-${i}`} className={clsx(sizeClass, 'text-primary/15')} />
        ))}
      </span>
      {/* Filled stars overlay, clipped to width % */}
      <span
        aria-hidden="true"
        className="flex absolute inset-0 overflow-hidden"
        style={{width: `${widthPct}%`}}
      >
        {Array.from({length: outOf}).map((_, i) => (
          <Star key={`fg-${i}`} className={clsx(sizeClass, 'text-amber-400')} />
        ))}
      </span>
    </span>
  );
}

function Star({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={clsx('shrink-0', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
