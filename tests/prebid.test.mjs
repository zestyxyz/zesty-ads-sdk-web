import { test, expect } from '@playwright/test';
import {
  checkZestyDiv
} from './test-constants.mjs';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8080/tests/prebid/', { waitUntil: 'domcontentloaded' });
  page.on('console', (msg) => {
    console.log(msg);
  });
});

test.describe('Zesty DIV behavior', () => {
  test('Check div when format is non-IAB', async ({ page }) => {
    expect(await checkZestyDiv(page))
  });
  test('Check div when format is medium-rectangle', async ({ page }) => {
    expect(await checkZestyDiv(page, 'medium-rectangle'))
  });
  test('Check div when format is billboard', async ({ page }) => {
    expect(await checkZestyDiv(page, 'billboard'))
  });
  test('Check div when format is mobile-phone-interstitial', async ({ page }) => {
    expect(await checkZestyDiv(page, 'mobile-phone-interstitial'))
  });
})