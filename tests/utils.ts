/**
 * Normalizes a BRL or USD price string to a float.
 * Examples: "R$\u00a099,90" => 99.90  |  "$19.99" => 19.99
 */
export function normalizePrice(price: string | null): number {
  if (!price) throw new Error('Price is null or undefined');
  // Remove currency symbols, spaces, non-breaking spaces
  const cleaned = price.replace(/[R$\s\u00a0]/g, '').trim();
  // Handle BRL format: 1.299,90 → 1299.90
  if (/\d+\.\d{3},\d{2}/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  // Handle BRL format: 99,90 → 99.90
  if (/^\d+,\d{2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  // Handle USD / plain format: 19.99
  return parseFloat(cleaned.replace(/[^0-9.]/g, ''));
}

/**
 * Waits for the cart drawer to be visible and stable.
 */
export async function waitForCartDrawer(page: import('@playwright/test').Page) {
  await page.waitForSelector('[data-test=subtotal], [role=dialog]', {
    state: 'visible',
    timeout: 10000,
  });
}
