# CountdownTimer

Contagem regressiva para promoções, lançamentos ou eventos. Exibe dias, horas, minutos e segundos. Desaparece automaticamente quando o tempo expira.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `CountdownTimer`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                    |
|--------------------|-----------------------|-------------|--------------------------------------------------------------|
| `heading`          | Single line text      | Não         | Título da promoção/evento                                    |
| `end_date`         | Date and time         | Sim         | Data/hora de término (formato ISO: `2024-12-31T23:59:59`)    |
| `cta_text`         | Single line text      | Não         | Texto do botão CTA                                           |
| `cta_link`         | URL                   | Não         | Link do botão CTA                                            |
| `background_color` | Color                 | Não         | Cor de fundo (padrão: `#000000`)                             |
| `text_color`       | Color                 | Não         | Cor do texto (padrão: `#ffffff`)                             |

## Como ativar na homepage

1. Crie um metaobject do tipo `CountdownTimer`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject
