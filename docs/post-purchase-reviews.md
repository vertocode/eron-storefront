# Post-Purchase Review Request — Setup Guide

The storefront-side machinery is already deployed (`/review/<orderId>` form, customer_review metaobject, custom.reviews metafield). The only remaining step is enabling the email trigger via **Shopify Flow** — a free first-party Shopify app — and activating it. ~2 minutes.

## 1. Install Shopify Flow

Apps → Browse apps → search **"Shopify Flow"** → install (free, by Shopify).

## 2. Create the workflow

Apps → **Flow** → **Create workflow** → click **Trigger**.

### Trigger
- Pick **Order fulfilled** (under "Shopify").

### Action
- After the trigger, click the **+** to add an action → search **Wait** → set delay to **10 days**.
- Add another action → search **Send Internal Email** → choose **Send email** (the Shopify Email action). Configure:
  - **To**: `{{ order.email }}`
  - **Subject**: `Sua opinião vale ouro 🌟 Como foi sua experiência com a Eron Fit?`
  - **Body** (plain HTML — paste verbatim):

```html
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
  <tr>
    <td style="padding: 32px 24px 16px;">
      <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3;">Como foi sua experiência?</h1>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
        Oi {{ order.customer.firstName | default: 'amiga' }} 💛
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
        Esperamos que você esteja amando o pedido <strong>{{ order.name }}</strong>! Sua opinião nos ajuda a melhorar — e ajuda outras mulheres a escolherem com confiança.
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Levaria 1 minutinho? Toca no botão abaixo:
      </p>
      <p style="margin: 0 0 24px;">
        <a href="https://checkout.eronfit.com/review/{{ order.legacyResourceId }}"
           style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Avaliar meu pedido ⭐
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666;">
        Com carinho,<br>
        Equipe Eron Fit
      </p>
    </td>
  </tr>
</table>
```

> Replace `https://checkout.eronfit.com` with your storefront domain if it ever changes.

## 3. Save + turn the workflow ON

Top-right of the Flow editor → **Turn on**. Done.

From now on, every fulfilled order triggers an email 10 days later. Customers click the button → land on `/review/<orderId>` → leave star rating + optional title/body → submission creates `customer_review` metaobjects (verified=true, dated today) and links them to the right products. The PDP renders the review automatically (above title summary + section below recommendations).

## How idempotency works

Each review is stored at `customer_review` metaobject handle `order-<orderLegacyId>-<productHandle>`. If a customer re-submits (e.g., updates their review), the existing metaobject is upserted — no duplicates, no extra references on the product metafield.

## What you can adjust later

- **Delay**: change "Wait 10 days" to anything 1–30 days. Brazilian e-commerce average response window peaks around 7–14 days post-delivery.
- **Email template**: edit copy / colors directly in the Flow action.
- **Delivery-based timing**: swap the trigger from **Order fulfilled** to **Order delivered** if the carrier reports delivery to Shopify (more accurate than "fulfilled").

## What's NOT in this flow (intentional)

- No second reminder email — keeps inbox respectful.
- No incentive (discount/gift) tied to the review — keeps reviews honest, avoids running afoul of Brazilian consumer protection rules around incentivized reviews.
- No moderation pipeline — every submission goes live immediately. If you want to gate reviews behind manual approval, add a `published` boolean field to the metaobject and have the storefront filter on it. Ping the team when ready.
