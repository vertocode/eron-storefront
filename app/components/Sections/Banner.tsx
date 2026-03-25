import {Link} from '~/components/Link';

export type BannerProps = {
  text?: string;
  cta?: string;
  link?: string;
  background_color?: string;
  text_color?: string;
};

export function Banner({
  text,
  cta,
  link,
  background_color,
  text_color,
}: BannerProps) {
  if (!text) return null;

  const content = (
    <div
      className="w-full py-3 px-6 flex items-center justify-center gap-4 text-sm font-medium"
      style={{
        backgroundColor: background_color ?? '#000',
        color: text_color ?? '#fff',
      }}
    >
      <span>{text}</span>
      {cta && (
        <span className="underline underline-offset-2 font-semibold">{cta}</span>
      )}
    </div>
  );

  return link ? (
    <Link to={link} prefetch="viewport">
      {content}
    </Link>
  ) : (
    content
  );
}
