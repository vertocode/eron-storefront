import {Button} from './Button';
import {FeaturedSection} from './FeaturedSection';
import {PageHeader, Text} from './Text';

export function NotFound({type = 'page'}: {type?: string}) {
  const heading = type === 'page' ? 'Pagina nao encontrada' : `${type} nao encontrado`;
  const description = 'Nao conseguimos encontrar o que voce procura. Tente verificar a URL ou voltar para a pagina inicial.';

  return (
    <>
      <PageHeader heading={heading}>
        <Text width="narrow" as="p">
          {description}
        </Text>
        <Button width="auto" variant="secondary" to={'/'}>
          Ir para a pagina inicial
        </Button>
      </PageHeader>
      <FeaturedSection />
    </>
  );
}
