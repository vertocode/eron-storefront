# Sections — Sistema de Seções Dinâmicas

As seções da homepage são configuradas via **Metaobjects do Shopify**. Isso permite editar o conteúdo da homepage diretamente pelo admin do Shopify, sem deploys.

## Como funciona

1. Cada seção é um **metaobject** de um tipo específico (ex: `HeroBanner`, `Banner`)
2. A page `homepage` tem um metafield `custom.sections` que contém uma **lista ordenada de IDs** de metaobjects
3. O storefront busca cada metaobject e renderiza o componente correspondente

## Seções disponíveis

| Seção                                                  | Tipo no Shopify        | Descrição                              |
|--------------------------------------------------------|------------------------|----------------------------------------|
| [HeroBanner](./HeroBanner.md)                          | `HeroBanner`           | Hero com imagem/vídeo e CTA            |
| [FeaturedProducts](./FeaturedProducts.md)              | `FeaturedProducts`     | Carrossel de produtos                  |
| [FeaturedCollections](./FeaturedCollections.md)        | `FeaturedCollections`  | Grid de collections                    |
| [RichText](./RichText.md)                              | `RichText`             | Bloco de texto rico                    |
| [ImageWithText](./ImageWithText.md)                    | `ImageWithText`        | Imagem + texto em duas colunas         |
| [Banner](./Banner.md)                                  | `Banner`               | Faixa de anúncio                       |
| [Newsletter](./Newsletter.md)                          | `Newsletter`           | Formulário de inscrição por e-mail     |
| [Testimonials](./Testimonials.md)                      | `Testimonials`         | Depoimentos de clientes                |
| [VideoSection](./VideoSection.md)                      | `VideoSection`         | Vídeo embed (YouTube/Vimeo/direto)     |
| [FAQ](./FAQ.md)                                        | `FAQ`                  | Perguntas frequentes com accordion     |
| [CountdownTimer](./CountdownTimer.md)                  | `CountdownTimer`       | Contagem regressiva para promoções     |
| [LogoList](./LogoList.md)                              | `LogoList`             | Lista de logos / selos de confiança    |

## Setup inicial

1. No Shopify Admin, crie as definições de metaobject para cada tipo de seção que deseja usar (veja cada doc)
2. Crie uma page com handle `homepage` (se ainda não existir)
3. Adicione o metafield `custom.sections` do tipo **List of metaobjects**
4. Crie e adicione metaobjects para montar a homepage
