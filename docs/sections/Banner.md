# Banner

Faixa horizontal fina no topo ou em qualquer posição da página. Ideal para anúncios de frete grátis, promoções, avisos.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `Banner`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                    |
|--------------------|-----------------------|-------------|--------------------------------------------------------------|
| `text`             | Single line text      | Sim         | Mensagem principal (ex: "Frete grátis acima de R$199")       |
| `cta`              | Single line text      | Não         | Texto de call-to-action clicável (ex: "Comprar agora")       |
| `link`             | URL                   | Não         | Link opcional para o banner inteiro + CTA                    |
| `background_color` | Color                 | Não         | Cor de fundo (padrão: `#000000`)                             |
| `text_color`       | Color                 | Não         | Cor do texto (padrão: `#ffffff`)                             |

## Como ativar na homepage

1. Crie um metaobject do tipo `Banner`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject

## Dica

Para exibir o banner no topo da página (antes do header), coloque-o como primeiro item na lista `custom.sections`.
