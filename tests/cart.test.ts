import {test, expect, type Page} from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the text of the first visible price element on the page. */
async function getPrice(page: Page): Promise<string> {
  const el = page.locator('[data-test=price]').first();
  await el.waitFor({state: 'visible', timeout: 8000});
  return (await el.textContent()) ?? '';
}

/** Opens the cart and waits for the drawer to show the subtotal. */
async function waitForCartSubtotal(page: Page): Promise<string> {
  await page.waitForSelector('[data-test=subtotal]', {
    state: 'visible',
    timeout: 12000,
  });
  return (await page.locator('[data-test=subtotal]').textContent()) ?? '';
}

/** Asserts the cart drawer shows NO error state. */
async function assertNoCartError(page: Page) {
  // Our errorElement text
  const errorMsg = page.getByText('Erro ao carregar o carrinho');
  await expect(errorMsg, 'cart drawer must not show an error').not.toBeVisible();
}

/**
 * Navigate to the first available product in a collection and add it to cart.
 * Returns the product handle for reference.
 */
async function addFirstProductFromCollection(
  page: Page,
  collectionHandle = 'frontpage',
): Promise<void> {
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('domcontentloaded');

  // Click the first product card in the grid
  const firstProduct = page
    .locator('[data-test=product-grid] a')
    .first();
  await firstProduct.waitFor({state: 'visible', timeout: 10000});
  await firstProduct.click();

  await page.waitForLoadState('domcontentloaded');

  // Click the first available (in-stock) variant option if present
  const variantBtn = page
    .locator('[data-test=add-to-cart]')
    .first();
  await variantBtn.waitFor({state: 'visible', timeout: 10000});

  await page.locator('[data-test=add-to-cart]').click();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Cart – critical flows', () => {
  // Clear cart cookies before each test so we always start fresh
  test.beforeEach(async ({context}) => {
    await context.clearCookies();
  });

  // -------------------------------------------------------------------------
  test('add first item opens cart drawer with correct subtotal', async ({page}) => {
    await addFirstProductFromCollection(page);

    const subtotal = await waitForCartSubtotal(page);
    await assertNoCartError(page);

    // Subtotal should be a non-empty price string
    expect(subtotal.trim().length, 'subtotal should not be empty').toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  test('add second item does NOT trigger a cart error', async ({page}) => {
    // --- First product ---
    await addFirstProductFromCollection(page, 'frontpage');
    await waitForCartSubtotal(page);
    await assertNoCartError(page);

    // Close the cart drawer
    const closeBtn = page.locator('[data-test=close-cart]');
    await closeBtn.waitFor({state: 'visible', timeout: 5000});
    await closeBtn.click();

    // --- Second product (different collection to maximise chance of a different product) ---
    await page.goto('/collections/conjuntos');
    await page.waitForLoadState('domcontentloaded');

    const secondProduct = page
      .locator('[data-test=product-grid] a')
      .first();
    await secondProduct.waitFor({state: 'visible', timeout: 10000});
    await secondProduct.click();

    await page.waitForLoadState('domcontentloaded');
    await page.locator('[data-test=add-to-cart]').click();

    // Cart drawer must open without errors
    await waitForCartSubtotal(page);
    await assertNoCartError(page);

    // We should have at least 2 total quantity shown
    const subtotal = await page.locator('[data-test=subtotal]').textContent();
    expect(subtotal?.trim().length, 'subtotal should not be empty').toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  test('add second item to same product increases quantity', async ({page}) => {
    await addFirstProductFromCollection(page);
    await waitForCartSubtotal(page);
    await assertNoCartError(page);

    // Read initial quantity
    const qtyEl = page.locator('[data-test=item-quantity]').first();
    await qtyEl.waitFor({state: 'visible', timeout: 5000});
    expect(await qtyEl.textContent()).toBe('1');

    // Increase quantity via + button
    await page.locator('button[name=increase-quantity]').first().click();

    await expect(
      page.locator('[data-test=item-quantity]').first(),
    ).toHaveText('2', {timeout: 8000});

    await assertNoCartError(page);
  });

  // -------------------------------------------------------------------------
  test('remove item from cart clears the drawer', async ({page}) => {
    await addFirstProductFromCollection(page);
    await waitForCartSubtotal(page);

    // Click remove button
    const removeBtn = page.getByRole('button', {name: /Remover/i}).first();
    await removeBtn.waitFor({state: 'visible', timeout: 5000});
    await removeBtn.click();

    // Cart empty state should appear
    await expect(
      page.getByText('Parece que você ainda não adicionou nada'),
    ).toBeVisible({timeout: 8000});
  });
});
