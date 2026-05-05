import {Link} from '@remix-run/react';

import {PageHeader, Section, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {StarRating} from '~/components/StarRating';

export default function ReviewThankYou() {
  return (
    <>
      <PageHeader heading="Obrigada por avaliar!">
        <div className="flex items-center gap-3">
          <StarRating value={5} size="lg" />
          <Text format width="narrow" as="p" className="inline-block">
            Sua avaliação foi enviada e em alguns minutos já aparece na página
            do produto. Sua opinião ajuda outras mulheres da nossa comunidade a
            escolherem com confiança.
          </Text>
        </div>
      </PageHeader>
      <Section>
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-4 text-center">
          <Button as={Link} to="/" variant="primary" className="rounded-lg px-6 py-3">
            Voltar para a loja
          </Button>
        </div>
      </Section>
    </>
  );
}
