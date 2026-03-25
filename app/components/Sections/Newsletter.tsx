import {useState} from 'react';
import {Heading, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {getInputStyleClasses} from '~/lib/utils';

export type NewsletterProps = {
  heading?: string;
  subtext?: string;
  placeholder?: string;
  button_text?: string;
  background_color?: string;
  text_color?: string;
};

export function Newsletter({
  heading = 'Assine nossa newsletter',
  subtext,
  placeholder = 'Seu e-mail',
  button_text = 'Inscrever-se',
  background_color,
  text_color,
}: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{
        backgroundColor: background_color ?? undefined,
        color: text_color ?? undefined,
      }}
    >
      <div className="max-w-xl mx-auto text-center flex flex-col gap-4">
        {heading && (
          <Heading as="h2" size="heading">
            {heading}
          </Heading>
        )}
        {subtext && (
          <Text as="p" size="copy">
            {subtext}
          </Text>
        )}
        {submitted ? (
          <Text as="p" size="lead" className="font-medium">
            Obrigado por se inscrever!
          </Text>
        ) : (
          <form
            className="flex flex-col sm:flex-row gap-3 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubmitted(true);
            }}
          >
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className={`${getInputStyleClasses()} flex-1`}
            />
            <Button type="submit">{button_text}</Button>
          </form>
        )}
      </div>
    </section>
  );
}
