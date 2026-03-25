# HeroBanner

Seção de destaque com imagem/vídeo de fundo, título, subtítulo e botão CTA. Ideal para a primeira seção da homepage.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `HeroBanner`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo               | Tipo no Shopify Admin         | Obrigatório | Descrição                                                                  |
|---------------------|-------------------------------|-------------|----------------------------------------------------------------------------|
| `heading`           | Single line text              | Não         | Título principal exibido sobre a imagem                                    |
| `by_line`           | Multi-line text               | Não         | Subtítulo ou descrição curta                                               |
| `cta`               | Single line text              | Não         | Texto do botão (ex: "Ver coleção")                                         |
| `collection_handle` | Single line text              | Não         | Handle da collection para link (ex: `summer-2024`)                        |
| `spread`            | File (Image / Video)          | Sim         | Imagem ou vídeo principal de fundo                                         |
| `spread_secondary`  | File (Image / Video)          | Não         | Segunda mídia exibida ao lado (desktop only)                               |
| `height`            | Single line text              | Não         | Altura: `full` (100vh), `half` (50vh), ou vazio (aspect-ratio automático) |
| `content_position`  | Single line text              | Não         | Posição do texto: `left-bottom` (padrão), `left-middle`, `left-top`, `right-top`, `right-middle`, `right-bottom`, `center` |
| `text_color`        | Color                         | Não         | Cor do texto (ex: `#ffffff`)                                               |
| `button_color`      | Color                         | Não         | Cor de fundo do botão CTA                                                  |
| `text_button_color` | Color                         | Não         | Cor do texto dentro do botão CTA                                           |

## Como ativar na homepage

1. Crie um metaobject do tipo `HeroBanner` preenchendo os campos
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` (tipo: List of metaobjects)
4. Adicione o ID do metaobject criado
