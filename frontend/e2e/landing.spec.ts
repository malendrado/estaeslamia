import { test, expect } from '@playwright/test';

test.describe('Landing', () => {
  test('muestra el hero y los CTAs principales', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /encuentra a quien/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Necesito un servicio' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ofrezco servicios' })).toBeVisible();
  });

  test('el CTA principal lleva al wizard de solicitud', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Necesito un servicio' }).first().click();
    await expect(page).toHaveURL(/\/solicitar$/);
  });

  test('muestra categorías populares cargadas desde el backend', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Categorías populares')).toBeVisible();
    // Al menos una categoría del seed debería estar visible
    await expect(page.getByText('Hogar', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });
});
