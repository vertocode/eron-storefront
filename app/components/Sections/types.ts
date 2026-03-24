import type {HeroBannerProps} from '~/components/Sections/HeroBanner';
import type {FeaturedProductsProps} from '~/components/Sections/FeaturedProducts';
import type {FeaturedCollectionsProps} from '~/components/Sections/FeaturedCollections';
import type {RichTextProps} from '~/components/Sections/RichText';
import type {ImageWithTextProps} from '~/components/Sections/ImageWithText';
import type {BannerProps} from '~/components/Sections/Banner';

export type SectionProps =
  | ({type: 'HeroBanner'} & HeroBannerProps)
  | ({type: 'FeaturedProducts'} & FeaturedProductsProps)
  | ({type: 'FeaturedCollections'} & FeaturedCollectionsProps)
  | ({type: 'RichText'} & RichTextProps)
  | ({type: 'ImageWithText'} & ImageWithTextProps)
  | ({type: 'Banner'} & BannerProps);
