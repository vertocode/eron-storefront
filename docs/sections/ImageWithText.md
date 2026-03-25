# ImageWithText

Seção dividida em duas colunas: imagem de um lado, texto com CTA do outro. Posição da imagem configurável.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `ImageWithText`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                         |
|--------------------|-----------------------|-------------|-------------------------------------------------------------------|
| `image`            | File (Image)          | Não         | Imagem exibida ao lado do texto                                   |
| `heading`          | Single line text      | Não         | Título da seção                                                   |
| `body`             | Multi-line text       | Não         | Texto descritivo                                                  |
| `cta_text`         | Single line text      | Não         | Texto do botão CTA (ex: "Saiba mais")                             |
| `cta_link`         | URL                   | Não         | Link do botão CTA                                                 |
| `image_position`   | Single line text      | Não         | Posição da imagem: `left` (padrão) ou `right`                     |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                             |

## Como ativar na homepage

1. Crie um metaobject do tipo `ImageWithText`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
