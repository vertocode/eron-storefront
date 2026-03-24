import type {SectionProps} from '~/components/Sections/types';
import {HeroBanner} from '~/components/Sections/HeroBanner';
import {FeaturedProducts} from '~/components/Sections/FeaturedProducts';
import {FeaturedCollections} from '~/components/Sections/FeaturedCollections';
import {RichText} from '~/components/Sections/RichText';
import {ImageWithText} from '~/components/Sections/ImageWithText';
import {Banner} from '~/components/Sections/Banner';

export function RenderSection(props: SectionProps) {
  switch (props.type) {
    case 'HeroBanner':
      return <HeroBanner {...props} loading="eager" />;
    case 'FeaturedProducts':
      return <FeaturedProducts {...props} />;
    case 'FeaturedCollections':
      return <FeaturedCollections {...props} />;
    case 'RichText':
      return <RichText {...props} />;
    case 'ImageWithText':
      return <ImageWithText {...props} />;
    case 'Banner':
      return <Banner {...props} />;
    default:
      return null;
  }
}
