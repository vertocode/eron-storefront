export type RichTextProps = {
  content?: string;
  background_color?: string;
  text_color?: string;
  alignment?: 'left' | 'center' | 'right';
};

export function RichText({
  content,
  background_color,
  text_color,
  alignment = 'center',
}: RichTextProps) {
  if (!content) return null;

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment];

  return (
    <section
      className={`py-12 px-6 md:px-12 ${alignClass}`}
      style={{
        backgroundColor: background_color ?? undefined,
        color: text_color ?? undefined,
      }}
    >
      <div
        className="prose prose-lg max-w-3xl mx-auto"
        dangerouslySetInnerHTML={{__html: content}}
      />
    </section>
  );
}
