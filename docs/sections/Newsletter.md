# Newsletter

Formulário de inscrição por e-mail. Exibe um campo de e-mail com botão de envio e mensagem de confirmação.

## Criar metaobject no Shopify Admin

1. Acesse **Content > Metaobjects > Add definition**
2. Nome: `Newsletter`
3. Adicione os campos abaixo

## Campos do Metaobject

| Campo              | Tipo no Shopify Admin | Obrigatório | Descrição                                                |
|--------------------|-----------------------|-------------|----------------------------------------------------------|
| `heading`          | Single line text      | Não         | Título da seção (padrão: "Assine nossa newsletter")      |
| `subtext`          | Multi-line text       | Não         | Texto descritivo abaixo do título                        |
| `placeholder`      | Single line text      | Não         | Placeholder do campo de e-mail (padrão: "Seu e-mail")    |
| `button_text`      | Single line text      | Não         | Texto do botão (padrão: "Inscrever-se")                  |
| `background_color` | Color                 | Não         | Cor de fundo da seção                                    |
| `text_color`       | Color                 | Não         | Cor do texto                                             |

## Como ativar na homepage

1. Crie um metaobject do tipo `Newsletter`
2. Acesse **Content > Pages > homepage**
3. Edite o metafield `custom.sections` e adicione o ID do metaobject

## Nota

Este é um formulário client-side. Para integrar com um serviço de e-mail marketing (Klaviyo, Mailchimp), adicione a lógica de envio no `onSubmit` do componente.
