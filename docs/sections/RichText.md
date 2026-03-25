# RichText

Bloco de texto rico (HTML) com fundo e cor configuráveis. Útil para mensagens editoriais, políticas, promoções textuais.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `RichText`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                              |
|--------------------|-----------------------|-------------|--------------------------------------------------------|
| `content`          | Rich text             | Sim         | Conteúdo HTML/rich text a exibir                       |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                  |
| `text_color`       | Color                 | Não         | Cor do texto                                           |
| `alignment`        | Single line text      | Não         | Alinhamento: `left`, `center` (padrão), `right`        |

## Como ativar na homepage

1. Crie um metaobject do tipo `RichText`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject

## Nota de segurança

O campo `content` é renderizado via `dangerouslySetInnerHTML`. Use apenas conteúdo controlado pelo próprio admin do Shopify.
