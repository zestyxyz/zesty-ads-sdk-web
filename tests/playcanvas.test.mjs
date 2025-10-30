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
    expect(banner1.split('/').pop()).toBe('250');
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
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    await page.waitForFunction(() => window.banner1?.findComponent('render')?.meshInstances[0]?._material?._diffuseMap?.name != null);
    const img1 = await page.evaluate(() => window.banner1.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    const img2 = await page.evaluate(() => window.banner2.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    const img3 = await page.evaluate(() => window.banner3.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    expect(EXAMPLE_IMAGE_MEDIUM_RECTANGLE).toContain(img1);
    expect(EXAMPLE_IMAGE_BILLBOARD).toContain(img2);
    expect(EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL).toContain(img3);
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    await page.waitForFunction(() => window.banner1?.findComponent('render')?.meshInstances[0]?._material?._diffuseMap?.name != null);
    const link1 = await page.evaluate(() => window.banner1.script['zesty-banner'].ctaUrl);
    const link2 = await page.evaluate(() => window.banner2.script['zesty-banner'].ctaUrl);
    const link3 = await page.evaluate(() => window.banner3.script['zesty-banner'].ctaUrl);
    expect(link1).toContain(EXAMPLE_URL);
    expect(link2).toContain(EXAMPLE_URL2);
    expect(link3).toContain(EXAMPLE_URL3);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0]._material._diffuseMap?.name != null);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => expectedValue.includes(window.banner3.findComponent('render').meshInstances[0]._material._diffuseMap?.name),
      [EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL]
    );
    await page.evaluate(([MEDIUM_RECTANGLE_ID]) => document.querySelector(`#injected-${MEDIUM_RECTANGLE_ID}`).remove(), [MEDIUM_RECTANGLE_ID]);
    await page.evaluate(([BILLBOARD_ID]) => document.querySelector(`#injected-${BILLBOARD_ID}`).remove(), [BILLBOARD_ID]);
    await page.evaluate(([MOBILE_PHONE_INTERSTITIAL_ID]) => document.querySelector(`#injected-${MOBILE_PHONE_INTERSTITIAL_ID}`).remove(), [MOBILE_PHONE_INTERSTITIAL_ID]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => expectedValue.includes(window.banner3.findComponent('render').meshInstances[0]._material._diffuseMap?.name),
      [EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL]
    );
    const img1 = await page.evaluate(() => window.banner1.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    const img2 = await page.evaluate(() => window.banner2.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    const img3 = await page.evaluate(() => window.banner3.findComponent('render').meshInstances[0]._material._diffuseMap.name);
    expect(EXAMPLE_IMAGE2_MEDIUM_RECTANGLE).toContain(img1);
    expect(EXAMPLE_IMAGE2_BILLBOARD).toContain(img2);
    expect(EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL).toContain(img3);
  });
});

test.describe('Modal', () => {
  test('An ad modal is created when the modal trigger event is fired', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0]._material._diffuseMap?.name != null);
    await page.evaluate(() => {
      let event = new CustomEvent('lose');
      document.dispatchEvent(event);
    });
    const modal = await page.waitForSelector('[popover="manual"]');
    const modalLink = await modal.evaluate(() => document.querySelector('[popover="manual"] > a').href);
    const modalImage = await modal.evaluate(() => document.querySelector('[popover="manual"] > a > img').src);
    expect(modal).toBeTruthy();
    expect(modalImage).toBe(EXAMPLE_IMAGE_MEDIUM_RECTANGLE);
    expect(modalLink).toContain(EXAMPLE_URL);
  });
});