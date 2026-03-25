import {Disclosure} from '@headlessui/react';
import {Heading, Text} from '~/components/Text';
import {IconCaret} from '~/components/Icon';

export type FAQItem = {
  question: string;
  answer: string;
};

export type FAQProps = {
  heading?: string;
  items?: string;
  background_color?: string;
  text_color?: string;
};

export function FAQ({
  heading = 'Perguntas Frequentes',
  items,
  background_color,
  text_color,
}: FAQProps) {
  let faqItems: FAQItem[] = [];
  try {
    faqItems = items ? JSON.parse(items) : [];
  } catch {
    return null;
  }

  if (!faqItems.length) return null;

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{
        backgroundColor: background_color ?? undefined,
        color: text_color ?? undefined,
      }}
    >
      <div className="max-w-3xl mx-auto">
        {heading && (
          <Heading as="h2" size="heading" className="text-center mb-8">
            {heading}
          </Heading>
        )}
        <div className="divide-y">
          {faqItems.map((item, i) => (
            <Disclosure key={i} as="div">
              {({open}) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full py-4">
                    <Text size="lead" className="text-left font-medium">
                      {item.question}
                    </Text>
                    <IconCaret direction={open ? 'up' : 'down'} />
                  </Disclosure.Button>
                  <Disclosure.Panel className="pb-4">
                    <Text as="p" size="copy" className="opacity-80">
                      {item.answer}
                    </Text>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
