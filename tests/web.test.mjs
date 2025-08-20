import { test, expect } from '@playwright/test';
import {
  injectIFrame,
  EXAMPLE_URL,
  EXAMPLE_IMAGE,
  EXAMPLE_IMAGE2,
  PREBID_LOAD_TEST_WAIT_INTERVAL,
  PREBID_REFRESH_TEST_WAIT_INTERVAL
} from './test-constants.mjs';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/web/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Web Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    const bannerCount = await page.evaluate(
      () => document.getElementsByTagName('zesty-web').length
    );
    expect(bannerCount).toBe(3);
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is displaying the correct default image', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    const banner1 = await page.evaluate(
      () => document.getElementById('banner1').shadowRoot.children[0].src
    );
    expect(banner1.split('/').pop()).toBe('zesty-default-medium-rectangle.png');
  });

  test('The billboard banner is displaying the correct default image', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner2').shadowRoot.children[0]);
    const banner2 = await page.evaluate(
      () => document.getElementById('banner2').shadowRoot.children[0].src
    );
    expect(banner2.split('/').pop()).toBe('zesty-default-billboard.png');
  });

  test('The mobile-phone-interstitial banner is displaying the correct default image', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner3').shadowRoot.children[0]);
    const banner3 = await page.evaluate(
      () => document.getElementById('banner3').shadowRoot.children[0].src
    );
    expect(banner3.split('/').pop()).toBe('zesty-default-mobile-phone-interstitial.png');
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

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img = await page.evaluate(
      () => document.getElementById('banner1').shadowRoot.children[0].src
    );
    expect(img.split('/').pop()).toBe('250');
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const link = await page.evaluate(() => document.getElementById('banner1').shadowRoot.children[0].getAttribute('data-url'));
    expect(link).toContain(EXAMPLE_URL);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE);
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    await page.evaluate(() => document.querySelector('#injected').remove());
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2);
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    const img = await page.evaluate(
      () => document.getElementById('banner1').shadowRoot.children[0].src
    );
    expect(img.split('/').pop()).toBe('300');
  });
});