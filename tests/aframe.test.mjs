import { test, expect } from '@playwright/test';
import {
  injectIFrame,
  EXAMPLE_URL,
  EXAMPLE_IMAGE,
  EXAMPLE_IMAGE2,
  PREBID_LOAD_TEST_WAIT_INTERVAL,
  PREBID_REFRESH_TEST_WAIT_INTERVAL
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
    const banner = await page.locator('#banner1 > a-plane');
    while (!img) {
      img = await banner.evaluate(srcEvaluate);
      if (!img) await page.waitForTimeout(100);
    }
    expect(img.split('/').pop()).toBe('zesty-default-medium-rectangle.png');
  });

  test('The billboard banner is displaying the correct default image', async ({ page }) => {
    let img;
    const banner = await page.locator('#banner2 > a-plane');
    while (!img) {
      img = await banner.evaluate(srcEvaluate);
      if (!img) await page.waitForTimeout(100);
    }
    expect(img.split('/').pop()).toBe('zesty-default-billboard.png');
  });

  test('The mobile-phone-interstitial banner is displaying the correct default image', async ({ page }) => {
    let img;
    const banner = await page.locator('#banner3 > a-plane');
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
    const banner = await page.locator('#banner3 > a-plane');
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
    const banner = page.locator('#banner1 > a-plane');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img = await banner.evaluate(srcEvaluate);
    expect(img.split('/').pop()).toBe('250');
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    const banner = page.locator('#banner1');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const link = await banner.evaluate(node => node.url);
    expect(link).toContain(EXAMPLE_URL);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    const banner = page.locator('#banner1 > a-plane');
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    await page.evaluate(() => document.querySelector('#injected').remove());
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    const img = await banner.evaluate(srcEvaluate);
    expect(img.split('/').pop()).toBe('300');
  });
});