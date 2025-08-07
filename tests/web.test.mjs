import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/web/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Web Test');
  });

  test('All 9 banners are currently loaded', async ({ page }) => {
    const bannerCount = await page.evaluate(
      () => document.getElementsByTagName('zesty-web').length
    );
    expect(bannerCount).toBe(9);
  });
});

test.describe('Standard styles', () => {
  test('The tall standard banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    const banner1 = await page.evaluate(
      () => document.getElementById('banner1').shadowRoot.children[0].src
    );
    expect(banner1.split('/').pop()).toBe('zesty-banner-tall.png');
  });

  test('The wide standard banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner2').shadowRoot.children[0]);
    const banner2 = await page.evaluate(
      () => document.getElementById('banner2').shadowRoot.children[0].src
    );
    expect(banner2.split('/').pop()).toBe('zesty-banner-wide.png');
  });

  test('The square standard banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner3').shadowRoot.children[0]);
    const banner3 = await page.evaluate(
      () => document.getElementById('banner3').shadowRoot.children[0].src
    );
    expect(banner3.split('/').pop()).toBe('zesty-banner-square.png');
  });
});

test.describe('Minimal styles', () => {
  test('The tall standard banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner4').shadowRoot.children[0]);
    const banner4 = await page.evaluate(
      () => document.getElementById('banner4').shadowRoot.children[0].src
    );
    expect(banner4.split('/').pop()).toBe('zesty-banner-tall-minimal.png');
  });

  test('The wide standard banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner5').shadowRoot.children[0]);
    const banner5 = await page.evaluate(
      () => document.getElementById('banner5').shadowRoot.children[0].src
    );
    expect(banner5.split('/').pop()).toBe('zesty-banner-wide-minimal.png');
  });

  test('The square standard banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner6').shadowRoot.children[0]);
    const banner6 = await page.evaluate(
      () => document.getElementById('banner6').shadowRoot.children[0].src
    );
    expect(banner6.split('/').pop()).toBe('zesty-banner-square-minimal.png');
  });
});

test.describe('Transparent styles', () => {
  test('The tall transparent banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner7').shadowRoot.children[0]);
    const banner7 = await page.evaluate(
      () => document.getElementById('banner7').shadowRoot.children[0].src
    );
    expect(banner7.split('/').pop()).toBe('zesty-banner-tall-transparent.png');
  });

  test('The wide transparent banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner8').shadowRoot.children[0]);
    const banner8 = await page.evaluate(
      () => document.getElementById('banner8').shadowRoot.children[0].src
    );
    expect(banner8.split('/').pop()).toBe('zesty-banner-wide-transparent.png');
  });

  test('The square transparent banner is present', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner9').shadowRoot.children[0]);
    const banner9 = await page.evaluate(
      () => document.getElementById('banner9').shadowRoot.children[0].src
    );
    expect(banner9.split('/').pop()).toBe('zesty-banner-square-transparent.png');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => document.getElementById('banner1').shadowRoot.children[0].click())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('Web Test');
  });
});