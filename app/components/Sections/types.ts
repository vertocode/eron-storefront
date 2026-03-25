import type {HeroBannerProps} from '~/components/Sections/HeroBanner';
import type {FeaturedProductsProps} from '~/components/Sections/FeaturedProducts';
import type {FeaturedCollectionsProps} from '~/components/Sections/FeaturedCollections';
import type {RichTextProps} from '~/components/Sections/RichText';
import type {ImageWithTextProps} from '~/components/Sections/ImageWithText';
import type {BannerProps} from '~/components/Sections/Banner';
import type {NewsletterProps} from '~/components/Sections/Newsletter';
import type {TestimonialsProps} from '~/components/Sections/Testimonials';
import type {VideoSectionProps} from '~/components/Sections/VideoSection';
import type {FAQProps} from '~/components/Sections/FAQ';
import type {CountdownTimerProps} from '~/components/Sections/CountdownTimer';
import type {LogoListProps} from '~/components/Sections/LogoList';

export type SectionProps =
  | ({type: 'HeroBanner'} & HeroBannerProps)
  | ({type: 'FeaturedProducts'} & FeaturedProductsProps)
  | ({type: 'FeaturedCollections'} & FeaturedCollectionsProps)
  | ({type: 'RichText'} & RichTextProps)
  | ({type: 'ImageWithText'} & ImageWithTextProps)
  | ({type: 'Banner'} & BannerProps)
  | ({type: 'Newsletter'} & NewsletterProps)
  | ({type: 'Testimonials'} & TestimonialsProps)
  | ({type: 'VideoSection'} & VideoSectionProps)
  | ({type: 'FAQ'} & FAQProps)
  | ({type: 'CountdownTimer'} & CountdownTimerProps)
  | ({type: 'LogoList'} & LogoListProps);
