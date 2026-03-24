# FeaturedProducts

Carrossel horizontal de produtos em destaque.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `FeaturedProducts`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo      | Tipo no Shopify Admin    | Obrigatório | Descrição                                             |
|------------|--------------------------|-------------|-------------------------------------------------------|
| `title`    | Single line text         | Não         | Título da seção (padrão: "Featured Products")         |
| `count`    | Integer                  | Não         | Número máximo de produtos a exibir (padrão: 8)        |
| `products` | List · Product reference | Sim         | Lista de produtos a exibir                            |

## Como ativar na homepage

1. Crie um metaobject do tipo `FeaturedProducts`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
