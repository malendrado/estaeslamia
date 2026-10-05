import { test, expect } from '@playwright/test';

test.describe('Wizard de solicitud pública', () => {
  test('completa el flujo y llega a la confirmación con número de solicitud', async ({ page }) => {
    await page.goto('/solicitar');

    // Paso 1: servicio
    await page.getByLabel('Categoría').click();
    await page.getByRole('option', { name: 'Hogar' }).click();
    await page.getByLabel('Servicio').click();
    await page.getByRole('option', { name: 'Instalación de aire acondicionado' }).click();
    await page.getByRole('button', { name: 'Continuar' }).first().click();

    // Paso 2: ubicación
    await page.getByLabel('Región').click();
    await page.getByRole('option', { name: 'Valparaíso' }).click();
    await page.getByLabel('Comuna').click();
    await page.getByRole('option', { name: 'Quintero' }).click();
    await page.getByRole('button', { name: 'Continuar' }).nth(1).click();

    // Paso 3: detalle
    await page.getByLabel('Describe lo que necesitas').fill('Necesito instalar 2 equipos de aire acondicionado en dormitorios.');
    await page.getByRole('button', { name: 'Continuar' }).nth(2).click();

    // Paso 4: contacto y consentimiento
    await page.getByLabel('Nombre').fill('Cliente E2E Playwright');
    await page.getByLabel('Email').fill(`e2e-${Date.now()}@example.cl`);
    await page.getByLabel('Teléfono').fill('+56911111111');
    await page.getByText('Acepto que mis datos').click();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    // Confirmación
    await expect(page).toHaveURL(/\/solicitud\/[a-f0-9-]+$/);
    await expect(page.getByText('¡Solicitud enviada!')).toBeVisible();
    await expect(page.getByText('N° de solicitud:')).toBeVisible();
  });

  test('no permite avanzar al último paso sin aceptar el consentimiento', async ({ page }) => {
    await page.goto('/solicitar');

    await page.getByLabel('Categoría').click();
    await page.getByRole('option', { name: 'Hogar' }).click();
    await page.getByLabel('Servicio').click();
    await page.getByRole('option', { name: 'Gasfitería' }).click();
    await page.getByRole('button', { name: 'Continuar' }).first().click();

    await page.getByLabel('Región').click();
    await page.getByRole('option', { name: 'Metropolitana de Santiago' }).click();
    await page.getByLabel('Comuna').click();
    await page.getByRole('option', { name: 'Santiago' }).click();
    await page.getByRole('button', { name: 'Continuar' }).nth(1).click();

    await page.getByLabel('Describe lo que necesitas').fill('Filtración de agua bajo el lavaplatos.');
    await page.getByRole('button', { name: 'Continuar' }).nth(2).click();

    await page.getByLabel('Nombre').fill('Cliente Sin Consentimiento');
    await page.getByLabel('Email').fill('sin-consentimiento@example.cl');
    await page.getByLabel('Teléfono').fill('+56922222222');

    await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled();
  });
});
