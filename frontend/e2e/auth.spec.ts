import { test, expect } from '@playwright/test';

test.describe('Autenticación y protección de rutas', () => {
  test('login como admin redirige a /admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@estaeslamia.cl');
    await page.getByLabel('Contraseña').fill('Demo1234!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  });

  test('credenciales inválidas muestran un mensaje de error y no navegan', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@estaeslamia.cl');
    await page.getByLabel('Contraseña').fill('contrasena-incorrecta');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText(/no pudimos iniciar sesión|credenciales inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un usuario no autenticado que intenta entrar a /admin es redirigido a /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un provider no puede acceder a /admin (redirige a home)', async ({ page, context }) => {
    await page.goto('/login');
    // Nota: usar el email real del primer provider ficticio del seed
    await page.getByLabel('Email').fill('contacto1@gasfiteria-los-andes.cl');
    await page.getByLabel('Contraseña').fill('Demo1234!');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/proveedor$/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });
});
