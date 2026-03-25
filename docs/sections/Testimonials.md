# Testimonials

Grid de depoimentos de clientes com citação, nome do autor e cargo/papel opcional.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `Testimonials`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                              |
|--------------------|-----------------------|-------------|------------------------------------------------------------------------|
| `heading`          | Single line text      | Não         | Título da seção (padrão: "O que nossos clientes dizem")                |
| `testimonials`     | JSON                  | Sim         | Array JSON de depoimentos (ver formato abaixo)                         |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                                  |
| `text_color`       | Color                 | Não         | Cor do texto                                                           |

## Formato do JSON `testimonials`

```json
[
  {"quote": "Produto incrível!", "author": "Maria S.", "role": "Cliente"},
  {"quote": "Entrega super rápida.", "author": "João P."}
]
```

## Como ativar na homepage

1. Crie um metaobject do tipo `Testimonials`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
