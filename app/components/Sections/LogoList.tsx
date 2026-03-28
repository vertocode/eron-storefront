import {Image} from '@shopify/hydrogen';
import {Heading, Section} from '~/components/Text';

export type LogoItem = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type LogoListProps = {
  heading?: string;
  logos?: string;
  background_color?: string;
};

export function LogoList({
  heading,
  logos,
  background_color,
}: LogoListProps) {
  let items: LogoItem[] = [];
  try {
    items = logos ? (JSON.parse(logos) as LogoItem[]) : [];
  } catch {
    return null;
  }

  if (!items.length) return null;

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{backgroundColor: background_color ?? undefined}}
    >
      <div className="max-w-6xl mx-auto">
        {heading && (
          <Heading as="h2" size="heading" className="text-center mb-8">
            {heading}
          </Heading>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {items.map((logo, i) => (
            <img
              key={i}
              src={logo.url}
              alt={logo.alt || ''}
              className="h-10 md:h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
