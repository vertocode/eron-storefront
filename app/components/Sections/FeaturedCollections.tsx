import {Image} from '@shopify/hydrogen';
import {Heading, Section} from '~/components/Text';
import {Grid} from '~/components/Grid';
import {Link} from '~/components/Link';

export type CollectionItem = {
  id: string;
  title: string;
  handle: string;
  image?: {
    altText?: string | null;
    width?: number | null;
    height?: number | null;
    url: string;
  } | null;
};

export type FeaturedCollectionsProps = {
  title?: string;
  collections?: CollectionItem[];
};

export function FeaturedCollections({
  title = 'Collections',
  collections = [],
}: FeaturedCollectionsProps) {
  const withImages = collections.filter((c) => c.image);
  if (!withImages.length) return null;

  return (
    <Section heading={title}>
      <Grid items={withImages.length}>
        {withImages.map((collection) => (
          <Link key={collection.id} to={`/collections/${collection.handle}`}>
            <div className="grid gap-4">
              <div className="card-image bg-primary/5 aspect-[3/2]">
                {collection.image && (
                  <Image
                    alt={`Image of ${collection.title}`}
                    data={collection.image}
                    sizes="(max-width: 32em) 100vw, 33vw"
                    aspectRatio="3/2"
                  />
                )}
              </div>
              <Heading size="copy">{collection.title}</Heading>
            </div>
          </Link>
        ))}
      </Grid>
    </Section>
  );
}
