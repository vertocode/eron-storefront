# FAQ

Seção de perguntas frequentes com accordion (expandir/recolher).

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `FAQ`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                  |
|--------------------|-----------------------|-------------|------------------------------------------------------------|
| `heading`          | Single line text      | Não         | Título da seção (padrão: "Perguntas Frequentes")           |
| `items`            | JSON                  | Sim         | Array JSON de perguntas e respostas (ver formato abaixo)   |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                      |
| `text_color`       | Color                 | Não         | Cor do texto                                               |

## Formato do JSON `items`

```json
[
  {"question": "Qual o prazo de entrega?", "answer": "De 3 a 7 dias úteis."},
  {"question": "Posso trocar um produto?", "answer": "Sim, em até 30 dias."}
]
```

## Como ativar na homepage

1. Crie um metaobject do tipo `FAQ`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
