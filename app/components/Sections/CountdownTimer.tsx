import {useState, useEffect} from 'react';
import {Heading, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';

export type CountdownTimerProps = {
  heading?: string;
  end_date?: string;
  cta_text?: string;
  cta_link?: string;
  background_color?: string;
  text_color?: string;
};

function getTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({
  heading,
  end_date,
  cta_text,
  cta_link,
  background_color,
  text_color,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!end_date) return;
    setMounted(true);
    setTimeLeft(getTimeLeft(end_date));
    const interval = setInterval(() => {
      const tl = getTimeLeft(end_date);
      setTimeLeft(tl);
      if (!tl) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [end_date]);

  if (!end_date || (mounted && !timeLeft)) return null;

  return (
    <section
      className="py-12 px-6 md:px-12"
      style={{
        backgroundColor: background_color ?? '#000',
        color: text_color ?? '#fff',
      }}
    >
      <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 items-center">
        {heading && (
          <Heading as="h2" size="heading">
            {heading}
          </Heading>
        )}
        {mounted && timeLeft && (
          <div className="flex gap-4 sm:gap-8">
            {[
              {value: timeLeft.days, label: 'Dias'},
              {value: timeLeft.hours, label: 'Horas'},
              {value: timeLeft.minutes, label: 'Min'},
              {value: timeLeft.seconds, label: 'Seg'},
            ].map(({value, label}) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-3xl sm:text-5xl font-bold tabular-nums">
                  {String(value).padStart(2, '0')}
                </span>
                <Text size="fine" className="opacity-70 mt-1">
                  {label}
                </Text>
              </div>
            ))}
          </div>
        )}
        {cta_text && cta_link && (
          <Link to={cta_link} prefetch="viewport">
            <Button className="mt-2">{cta_text}</Button>
          </Link>
        )}
      </div>
    </section>
  );
}
