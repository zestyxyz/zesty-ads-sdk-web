import { test, expect } from '@playwright/test';

test.describe('Initial load', () => {
  test('Should throw warning if data-id is not present at all', async ({ page }) => {
    await page.goto('http://localhost:8080/tests/beacon/error-missing.html');
    page.on('console', msg => {
      expect(msg.type()).toBe('warn');
      expect(msg.text()).toBe('Borellion Beacon script has been added but no space ID was given!');
    })
  });
  test('Should throw warning if data-id is present but blank', async ({ page }) => {
    await page.goto('http://localhost:8080/tests/beacon/error-blank.html');
    page.on('console', msg => {
      expect(msg.type()).toBe('warn');
      expect(msg.text()).toBe('Borellion Beacon script has been added but no space ID was given!');
    })
  });
})