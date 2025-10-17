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
  MEDIUM_RECTANGLE_ID,
  BILLBOARD_ID,
  MOBILE_PHONE_INTERSTITIAL_ID,
} from './test-constants.mjs';

function srcEvaluate(node) {
  if (typeof node.components.material.data.src === 'string') {
    return node.components.material.data.src;
  } else {
    return node.components.material.data.src.currentSrc;
  }
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8080/tests/aframe/', { waitUntil: 'domcontentloaded' });
  page.on('console', (msg) => {
    console.log(msg);
  });
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('A-Frame Test');
  });

  test('The medium-rectangle banner is present', async ({ page }) => {
    const banner = await page.locator('#banner1').getAttribute('zesty-banner');
    expect(banner).not.toBeFalsy();
  });

  test('The billboard banner is present', async ({ page }) => {
    const banner = await page.locator('#banner2').getAttribute('zesty-banner');
    expect(banner).not.toBeFalsy();
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    const banner = await page.locator('#banner3').getAttribute('zesty-banner');
    expect(banner).not.toBeFalsy();
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is displaying the correct default image', async ({ page }) => {
    let img;
    const banner = page.locator('#banner1 > a-plane');
    while (!img) {
      img = await banner.evaluate(srcEvaluate);
      if (!img) await page.waitForTimeout(100);
    }
    expect(img.split('/').pop()).toBe('250'); // Custom default image
  });

  test('The billboard banner is displaying the correct default image', async ({ page }) => {
    let img;
    const banner = page.locator('#banner2 > a-plane');
    while (!img) {
      img = await banner.evaluate(srcEvaluate);
      if (!img) await page.waitForTimeout(100);
    }
    expect(img.split('/').pop()).toBe('zesty-default-billboard.png');
  });

  test('The mobile-phone-interstitial banner is displaying the correct default image', async ({ page }) => {
    let img;
    const banner = page.locator('#banner3 > a-plane');
    while (!img) {
      img = await banner.evaluate(srcEvaluate);
      if (!img) await page.waitForTimeout(100);
    }
    expect(img.split('/').pop()).toBe('zesty-default-mobile-phone-interstitial.png');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    let img;
    const banner = page.locator('#banner3 > a-plane');
    while (!img) {
      img = await banner.evaluate(srcEvaluate);
      if (!img) await page.waitForTimeout(100);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.mouse.click(page.viewportSize().width / 2, page.viewportSize().height / 2)
    ])
    await newPage.waitForLoadState('domcontentloaded', { timeout: 60000 }); // Adjust timeout as needed
    const title = await newPage.title();
    expect(title).not.toBe('A-Frame Test');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    const banner1 = page.locator('#banner1 > a-plane');
    const banner2 = page.locator('#banner2 > a-plane');
    const banner3 = page.locator('#banner3 > a-plane');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img1 = await banner1.evaluate(srcEvaluate);
    const img2 = await banner2.evaluate(srcEvaluate);
    const img3 = await banner3.evaluate(srcEvaluate);
    expect(img1).toBe(EXAMPLE_IMAGE_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL);
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    const banner1 = page.locator('#banner1');
    const banner2 = page.locator('#banner2');
    const banner3 = page.locator('#banner3');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => document.querySelector('#banner1 > a-plane').components.material.data.src.currentSrc == expectedValue,
      [EXAMPLE_IMAGE_MEDIUM_RECTANGLE]
    );
    const link1 = await banner1.evaluate(node => node.url);
    const link2 = await banner2.evaluate(node => node.url);
    const link3 = await banner3.evaluate(node => node.url);
    expect(link1).toContain(EXAMPLE_URL);
    expect(link2).toContain(EXAMPLE_URL2);
    expect(link3).toContain(EXAMPLE_URL3);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    const banner1 = page.locator('#banner1 > a-plane');
    const banner2 = page.locator('#banner2 > a-plane');
    const banner3 = page.locator('#banner3 > a-plane');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => document.querySelector('#banner1 > a-plane').components.material.data.src.currentSrc == expectedValue,
      [EXAMPLE_IMAGE_MEDIUM_RECTANGLE]
    );
    await page.evaluate(([MEDIUM_RECTANGLE_ID]) => document.querySelector(`#injected-${MEDIUM_RECTANGLE_ID}`).remove(), [MEDIUM_RECTANGLE_ID]);
    await page.evaluate(([BILLBOARD_ID]) => document.querySelector(`#injected-${BILLBOARD_ID}`).remove(), [BILLBOARD_ID]);
    await page.evaluate(([MOBILE_PHONE_INTERSTITIAL_ID]) => document.querySelector(`#injected-${MOBILE_PHONE_INTERSTITIAL_ID}`).remove(), [MOBILE_PHONE_INTERSTITIAL_ID]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE2_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => document.querySelector('#banner1 > a-plane').components.material.data.src.currentSrc == expectedValue,
      [EXAMPLE_IMAGE2_MEDIUM_RECTANGLE]
    );
    const img1 = await banner1.evaluate(srcEvaluate);
    const img2 = await banner2.evaluate(srcEvaluate);
    const img3 = await banner3.evaluate(srcEvaluate);
    expect(img1).toBe(EXAMPLE_IMAGE2_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE2_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL);
  });
});