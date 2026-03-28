import {useState} from 'react';
import {Image} from '@shopify/hydrogen';

import type {MediaFragment} from 'storefrontapi.generated';

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */
export function ProductGallery({
  media,
  className,
}: {
  media: MediaFragment[];
  className?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!media.length) {
    return null;
  }

  const selectedMedia = media[selectedIndex];
  const selectedImage =
    selectedMedia?.__typename === 'MediaImage'
      ? {...selectedMedia.image, altText: selectedMedia.alt || 'Imagem do produto'}
      : null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main image */}
      <div className="aspect-square bg-white dark:bg-contrast/10 rounded-lg overflow-hidden">
        {selectedImage && (
          <Image
            loading="eager"
            data={selectedImage}
            sizes="(min-width: 48em) 60vw, 90vw"
            className="object-cover w-full h-full fadeIn"
          />
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 hiddenScroll">
          {media.map((med, i) => {
            const thumbImage =
              med.__typename === 'MediaImage'
                ? {...med.image, altText: med.alt || 'Miniatura do produto'}
                : null;

            if (!thumbImage) return null;

            return (
              <button
                key={med.id || thumbImage.id}
                onClick={() => setSelectedIndex(i)}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                  i === selectedIndex
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  loading="lazy"
                  data={thumbImage}
                  sizes="80px"
                  className="object-cover w-full h-full"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
