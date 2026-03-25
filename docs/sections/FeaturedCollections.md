# FeaturedCollections

Grid de collections com imagem e título. Clicável — leva para a página da collection.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `FeaturedCollections`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo         | Tipo no Shopify Admin           | Obrigatório | Descrição                                                          |
|---------------|---------------------------------|-------------|--------------------------------------------------------------------|
| `title`       | Single line text                | Não         | Título da seção (padrão: "Collections")                            |
| `collections` | List · Collection reference     | Sim         | Lista de collections a exibir (apenas as com imagem são mostradas) |

## Como ativar na homepage

1. Crie um metaobject do tipo `FeaturedCollections`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
