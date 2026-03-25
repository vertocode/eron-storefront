import {Heading, Section, Text} from '~/components/Text';

export type Testimonial = {
  quote: string;
  author: string;
  role?: string;
};

export type TestimonialsProps = {
  heading?: string;
  testimonials?: string;
  background_color?: string;
  text_color?: string;
};

export function Testimonials({
  heading = 'O que nossos clientes dizem',
  testimonials,
  background_color,
  text_color,
}: TestimonialsProps) {
  let items: Testimonial[] = [];
  try {
    items = testimonials ? JSON.parse(testimonials) : [];
  } catch {
    return null;
  }

  if (!items.length) return null;

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{
        backgroundColor: background_color ?? undefined,
        color: text_color ?? undefined,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {heading && (
          <Heading as="h2" size="heading" className="text-center mb-8">
            {heading}
          </Heading>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-primary/5 rounded-lg p-6 flex flex-col gap-4"
            >
              <Text as="p" size="copy" className="italic">
                &ldquo;{item.quote}&rdquo;
              </Text>
              <div>
                <Text as="p" size="fine" className="font-semibold">
                  {item.author}
                </Text>
                {item.role && (
                  <Text as="p" size="fine" className="opacity-60">
                    {item.role}
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
