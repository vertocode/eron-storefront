import {Image} from '@shopify/hydrogen';
import type {MediaImage} from '@shopify/hydrogen/storefront-api-types';
import {Heading, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';

export type ImageWithTextProps = {
  heading?: string;
  body?: string;
  cta_text?: string;
  cta_link?: string;
  image?: MediaImage['image'];
  image_position?: 'left' | 'right';
  background_color?: string;
};

export function ImageWithText({
  heading,
  body,
  cta_text,
  cta_link,
  image,
  image_position = 'left',
  background_color,
}: ImageWithTextProps) {
  const isRight = image_position === 'right';

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{backgroundColor: background_color ?? undefined}}
    >
      <div
        className={`max-w-6xl mx-auto flex flex-col gap-8 items-center ${
          isRight ? 'md:flex-row-reverse' : 'md:flex-row'
        }`}
      >
        {image && (
          <div className="w-full md:w-1/2">
            <Image
              data={image}
              className="w-full h-auto rounded-lg object-cover aspect-[4/3]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          {heading && (
            <Heading as="h2" size="heading">
              {heading}
            </Heading>
          )}
          {body && (
            <Text as="p" size="copy">
              {body}
            </Text>
          )}
          {cta_text && cta_link && (
            <Link to={cta_link} prefetch="viewport">
              <Button>{cta_text}</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
