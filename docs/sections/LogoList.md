# LogoList

Lista de logos de marcas, parceiros ou selos de confiança. Exibe em linha com efeito hover.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `LogoList`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                |
|--------------------|-----------------------|-------------|----------------------------------------------------------|
| `heading`          | Single line text      | Não         | Título da seção (ex: "Marcas parceiras")                 |
| `logos`            | JSON                  | Sim         | Array JSON de logos (ver formato abaixo)                 |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                    |

## Formato do JSON `logos`

```json
[
  {"url": "https://cdn.shopify.com/s/.../logo1.png", "alt": "Marca A"},
  {"url": "https://cdn.shopify.com/s/.../logo2.png", "alt": "Marca B"}
]
```

## Como ativar na homepage

1. Crie um metaobject do tipo `LogoList`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
