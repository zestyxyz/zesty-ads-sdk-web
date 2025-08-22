import { test, expect } from '@playwright/test';
import {
  injectIFrame,
  EXAMPLE_URL,
  EXAMPLE_URL2,
  EXAMPLE_URL3,
  EXAMPLE_IMAGE_MEDIUM_RECTANGLE,
  EXAMPLE_IMAGE_BILLBOARD,
  EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL,
  EXAMPLE_IMAGE2_MEDIUM_RECTANGLE,
  EXAMPLE_IMAGE2_BILLBOARD,
  EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL,
  PREBID_LOAD_TEST_WAIT_INTERVAL,
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
    expect(banner1.split('/').pop()).toBe('zesty-default-medium-rectangle.png');
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
    await page.waitForFunction(() => window.scene?.children[1]?.children[0]?.material?.map?.source != null);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => window.scene.children[1].children[0].__r3f.handlers.onClick())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('React Three Fiber Test');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, '00000000-0000-0000-0000-000000000000');
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, '10000000-0000-4000-8000-000000000000');
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, '20000000-0000-4000-8000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img1 = await page.evaluate(() => window.scene.children[1].children[0].material.map.source.data.currentSrc);
    const img2 = await page.evaluate(() => window.scene.children[2].children[0].material.map.source.data.currentSrc);
    const img3 = await page.evaluate(() => window.scene.children[3].children[0].material.map.source.data.currentSrc);
    expect(EXAMPLE_IMAGE_MEDIUM_RECTANGLE).toContain(img1);
    expect(EXAMPLE_IMAGE_BILLBOARD).toContain(img2);
    expect(EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL).toContain(img3);
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, '00000000-0000-0000-0000-000000000000');
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, '10000000-0000-4000-8000-000000000000');
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, '20000000-0000-4000-8000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const link1 = await page.evaluate(() => window.scene.children[1].children[0].url);
    const link2 = await page.evaluate(() => window.scene.children[2].children[0].url);
    const link3 = await page.evaluate(() => window.scene.children[3].children[0].url);
    expect(link1).toContain(EXAMPLE_URL);
    expect(link2).toContain(EXAMPLE_URL2);
    expect(link3).toContain(EXAMPLE_URL3);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, '00000000-0000-0000-0000-000000000000');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_BILLBOARD, '10000000-0000-4000-8000-000000000000');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, '20000000-0000-4000-8000-000000000000');
    await page.waitForFunction(
      ([expectedValue]) => window.scene.children[3].children[0].material.map?.source.data.currentSrc == expectedValue,
      [EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL]
    );
    await page.evaluate(() => document.querySelector(`#injected-00000000-0000-0000-0000-000000000000`).remove());
    await page.evaluate(() => document.querySelector(`#injected-10000000-0000-4000-8000-000000000000`).remove());
    await page.evaluate(() => document.querySelector(`#injected-20000000-0000-4000-8000-000000000000`).remove());
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MEDIUM_RECTANGLE, '00000000-0000-0000-0000-000000000000');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_BILLBOARD, '10000000-0000-4000-8000-000000000000');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL, '20000000-0000-4000-8000-000000000000');
    await page.waitForFunction(
      ([expectedValue]) => window.scene.children[3].children[0].material.map?.source.data.currentSrc == expectedValue,
      [EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL]
    );
    const img1 = await page.evaluate(() => window.scene.children[1].children[0].material.map.source.data.currentSrc);
    const img2 = await page.evaluate(() => window.scene.children[2].children[0].material.map.source.data.currentSrc);
    const img3 = await page.evaluate(() => window.scene.children[3].children[0].material.map.source.data.currentSrc);
    expect(img1).toBe(EXAMPLE_IMAGE2_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE2_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL);
  });
});