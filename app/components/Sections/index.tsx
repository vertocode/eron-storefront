import type {SectionProps} from '~/components/Sections/types';
import {HeroBanner} from '~/components/Sections/HeroBanner';
import {FeaturedProducts} from '~/components/Sections/FeaturedProducts';
import {FeaturedCollections} from '~/components/Sections/FeaturedCollections';
import {RichText} from '~/components/Sections/RichText';
import {ImageWithText} from '~/components/Sections/ImageWithText';
import {Banner} from '~/components/Sections/Banner';
import {Newsletter} from '~/components/Sections/Newsletter';
import {Testimonials} from '~/components/Sections/Testimonials';
import {VideoSection} from '~/components/Sections/VideoSection';
import {FAQ} from '~/components/Sections/FAQ';
import {CountdownTimer} from '~/components/Sections/CountdownTimer';
import {LogoList} from '~/components/Sections/LogoList';

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
    case 'Newsletter':
      return <Newsletter {...props} />;
    case 'Testimonials':
      return <Testimonials {...props} />;
    case 'VideoSection':
      return <VideoSection {...props} />;
    case 'FAQ':
      return <FAQ {...props} />;
    case 'CountdownTimer':
      return <CountdownTimer {...props} />;
    case 'LogoList':
      return <LogoList {...props} />;
    default:
      return null;
  }
}
