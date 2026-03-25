import {Heading} from '~/components/Text';

export type VideoSectionProps = {
  heading?: string;
  video_url?: string;
  background_color?: string;
};

export function VideoSection({
  heading,
  video_url,
  background_color,
}: VideoSectionProps) {
  if (!video_url) return null;

  const embedUrl = getEmbedUrl(video_url);

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{backgroundColor: background_color ?? undefined}}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {heading && (
          <Heading as="h2" size="heading" className="text-center">
            {heading}
          </Heading>
        )}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={heading || 'Vídeo'}
            />
          ) : (
            <video
              src={video_url}
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname.includes('youtu.be')
    ) {
      const id =
        parsed.hostname.includes('youtu.be')
          ? parsed.pathname.slice(1)
          : parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    // not a valid URL
  }
  return null;
}
