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
  await page.goto('http://localhost:8080/tests/r3f/dist/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('React Three Fiber Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    await page.waitForFunction(() => window.scene != null);
    const bannerCount = await page.evaluate(() => window.scene.children.length);
    expect(bannerCount).toBe(4); // First child is camera, last are banners
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[1]?.children[0]?.material?.map?.source != null);
    const banner1 = await page.evaluate(() => window.scene.children[1].children[0].material.map.source.data.currentSrc);
    expect(banner1.split('/').pop()).toBe('250');
  });

  test('The billboard banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[2]?.children[0]?.material?.map?.source != null);
    const banner2 = await page.evaluate(() => window.scene.children[2].children[0].material.map.source.data.currentSrc);
    expect(banner2.split('/').pop()).toBe('zesty-default-billboard.png');
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[3]?.children[0]?.material?.map?.source != null);
    const banner3 = await page.evaluate(() => window.scene.children[3].children[0].material.map.source.data.currentSrc);
    expect(banner3.split('/').pop()).toBe('zesty-default-mobile-phone-interstitial.png');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => window.scene?.children[2].children[0].__r3f.handlers.onClick != null);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => window.scene.children[2].children[0].__r3f.handlers.onClick())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('React Three Fiber Test');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img = await page.evaluate(() => window.scene.children[1].children[0].material.map.source.data.currentSrc);
    expect(img.split('/').pop()).toBe('250');
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const link = await page.evaluate(() => window.scene.children[1].children[0].url);
    expect(link).toContain(EXAMPLE_URL);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE);
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    await page.evaluate(() => document.querySelector('#injected').remove());
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2);
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    const img = await page.evaluate(() => window.scene.children[1].children[0].material.map.source.data.currentSrc);
    expect(img.split('/').pop()).toBe('300');
  });
});