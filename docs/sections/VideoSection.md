# VideoSection

Seção de vídeo embed. Suporta YouTube, Vimeo e URLs diretas de vídeo.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `VideoSection`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                    |
|--------------------|-----------------------|-------------|--------------------------------------------------------------|
| `heading`          | Single line text      | Não         | Título exibido acima do vídeo                                |
| `video_url`        | URL                   | Sim         | URL do vídeo (YouTube, Vimeo, ou URL direta .mp4)            |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                        |

## URLs suportadas

- YouTube: `https://www.youtube.com/watch?v=XXXXX` ou `https://youtu.be/XXXXX`
- Vimeo: `https://vimeo.com/XXXXX`
- Direto: qualquer URL de arquivo de vídeo (renderiza com `<video>`)

## Como ativar na homepage

1. Crie um metaobject do tipo `VideoSection`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
