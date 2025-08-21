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
  await page.goto('http://localhost:8080/tests/playcanvas/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Playcanvas Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    await page.waitForFunction(() => window.banner1 != null);
    const banner1 = await page.evaluate(() => window.banner1);
    const banner2 = await page.evaluate(() => window.banner2);
    const banner3 = await page.evaluate(() => window.banner3);
    expect(!!banner1 && !!banner2 && !!banner3).toBeTruthy();
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0]?._material._diffuseMap?.name != null);
    const banner1 = await page.evaluate(() => window.banner1.findComponent('render')?.meshInstances[0]._material._diffuseMap.name);
    expect(banner1.split('/').pop()).toBe('zesty-default-medium-rectangle.png');
  });

  test('The billboard banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.banner2?.findComponent('render').meshInstances[0]?._material._diffuseMap?.name != null);
    const banner2 = await page.evaluate(() => window.banner2.findComponent('render')?.meshInstances[0]._material._diffuseMap.name);
    expect(banner2.split('/').pop()).toBe('zesty-default-billboard.png');
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.banner3?.findComponent('render').meshInstances[0]?._material._diffuseMap?.name != null);
    const banner3 = await page.evaluate(() => window.banner3.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    expect(banner3.split('/').pop()).toBe('zesty-default-mobile-phone-interstitial.png');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0].material?.diffuseMap?.name != null);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => window.banner1.script['zesty-banner'].onSelect({ x: window.banner1._app.renderer.scene.device.canvas.width / 2, y: window.banner1._app.renderer.scene.device.canvas.height / 4 }))
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('Playcanvas Test');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    await page.waitForFunction(() => window.banner1?.findComponent('render')?.meshInstances[0]?._material?._diffuseMap?.name != null);
    const img = await page.evaluate(() => window.banner1.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    expect(img.split('/').pop()).toBe('250');
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    await page.waitForFunction(() => window.banner1?.findComponent('render')?.meshInstances[0]?._material?._diffuseMap?.name != null);
    const link = await page.evaluate(() => window.banner1.script['zesty-banner'].ctaUrl);
    expect(link).toContain(EXAMPLE_URL);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0]._material._diffuseMap?.name != null);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    await page.evaluate(() => document.querySelector('#injected').remove());
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2, '00000000-0000-0000-0000-000000000000');
    await new Promise(res => setTimeout(res, PREBID_REFRESH_TEST_WAIT_INTERVAL));
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0]._material._diffuseMap?.name != null);
    const img = await page.evaluate(() => window.banner1.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    expect(img.split('/').pop()).toBe('300');
  });
});