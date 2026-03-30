import clsx from 'clsx';
import {MediaFile} from '@shopify/hydrogen';
import type {
  MediaImage,
  Media,
  Video as MediaVideo,
} from '@shopify/hydrogen/storefront-api-types';

import {Heading, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';

export type HeroBannerProps = {
  by_line?: string;
  cta?: string;
  collection_handle?: string;
  content_position?:
    | 'left-bottom'
    | 'left-middle'
    | 'left-top'
    | 'right-top'
    | 'right-middle'
    | 'right-bottom'
    | 'center';
  heading?: string;
  height?: 'full' | 'half' | string;
  loading?: HTMLImageElement['loading'];
  spread?: Media | MediaImage;
  spreadSecondary?: Media | MediaImage;
  top?: boolean;
  text_color?: string;
  text_button_color?: string;
  button_color?: string;
};

export function HeroBanner({
  by_line,
  cta,
  collection_handle,
  content_position,
  heading,
  height,
  loading,
  spread,
  spreadSecondary,
  top,
  text_color,
  text_button_color,
  button_color,
}: HeroBannerProps) {
  const positionClasses = clsx(
    'absolute px-6 py-8 sm:px-8 md:px-12 max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[50%]',
    !text_color && 'text-contrast dark:text-primary',
    {
      'left-0 bottom-0':
        content_position === 'left-bottom' || !content_position,
      'left-0 top-1/2 -translate-y-1/2': content_position === 'left-middle',
      'left-0 top-0': content_position === 'left-top',
      'right-0 top-0': content_position === 'right-top',
      'right-0 top-1/2 -translate-y-1/2': content_position === 'right-middle',
      'right-0 bottom-0': content_position === 'right-bottom',
      'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center items-center':
        content_position === 'center',
    },
  );

  const inner = (
    <section
      className={clsx(
        'relative justify-end flex flex-col w-full',
        top && '-mt-nav',
        height === 'full'
          ? 'h-screen'
          : height === 'half'
          ? 'h-[50vh]'
          : 'aspect-[4/5] sm:aspect-square md:aspect-[5/4] lg:aspect-[3/2] xl:aspect-[2/1]',
      )}
    >
      <div className="absolute inset-0 w-screen left-1/2 -translate-x-1/2 overflow-hidden -z-10">
        <div className="pointer-events-none content-stretch overflow-clip flex">
          {spread && (
            <div className="flex-1">
              <SpreadMedia
                sizes={
                  spreadSecondary ? '(min-width: 48em) 50vw, 100vw' : '100vw'
                }
                data={spread}
                loading={loading}
              />
            </div>
          )}
          {spreadSecondary && (
            <div className="flex-1 hidden md:block">
              <SpreadMedia
                sizes="50vw"
                data={spreadSecondary}
                loading={loading}
              />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 dark:from-contrast/60 to-transparent z-10" />
      </div>
      <div
        className={positionClasses}
        style={text_color ? {color: text_color} : undefined}
      >
        {heading && (
          <Heading format as="h2" size="display" className="max-w-md">
            {heading}
          </Heading>
        )}
        {by_line && (
          <Text format width="narrow" as="p" size="lead">
            {by_line}
          </Text>
        )}
        {cta && (
          <Button
            className="mt-3"
            style={{color: text_button_color, backgroundColor: button_color}}
          >
            {cta}
          </Button>
        )}
      </div>
    </section>
  );

  return collection_handle ? (
    <Link to={`/collections/${collection_handle}`} prefetch="viewport">
      {inner}
    </Link>
  ) : (
    inner
  );
}

type SpreadMediaProps = {
  data: Media | MediaImage | MediaVideo;
  loading?: HTMLImageElement['loading'];
  sizes: string;
};

function SpreadMedia({data, loading, sizes}: SpreadMediaProps) {
  return (
    <MediaFile
      data={data as Media}
      className="absolute inset-0 w-full h-full object-fill"
      mediaOptions={{
        video: {
          controls: false,
          muted: true,
          loop: true,
          playsInline: true,
          autoPlay: true,
          previewImageOptions: {src: (data as any).previewImage?.url ?? ''},
        },
        image: {
          loading,
          crop: 'center',
          sizes,
          alt: (data as any).alt || '',
        },
      }}
    />
  );
}
