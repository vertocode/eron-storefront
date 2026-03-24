import {Button} from './Button';
import {FeaturedSection} from './FeaturedSection';
import {PageHeader, Text} from './Text';

export function NotFound({type = 'page'}: {type?: string}) {
  const heading = `Não encontramos esta ${type === ‘page’ ? ‘página’ : type}`;
  const description = `Não conseguimos encontrar ${type === ‘page’ ? ‘a página’ : type} que você procura. Tente verificar a URL ou voltar para a página inicial.`;

  return (
    <>
      <PageHeader heading={heading}>
        <Text width="narrow" as="p">
          {description}
        </Text>
        <Button width="auto" variant="secondary" to={'/'}>
          Ir para a página inicial
        </Button>
      </PageHeader>
      <FeaturedSection />
    </>
  );
}
