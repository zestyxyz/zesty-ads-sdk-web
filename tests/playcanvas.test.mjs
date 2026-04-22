import { test, expect } from '@playwright/test';

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

test.describe('Modal', () => {
  test('An ad modal is created when the modal trigger event is fired @skip', async ({ page }) => {
    await page.waitForFunction(() => window.banner1?.findComponent('render').meshInstances[0]?._material._diffuseMap?.name != null);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('lose')));
    const modal = await page.waitForSelector('[popover="manual"]');
    expect(modal).toBeTruthy();
    const modalImage = await page.$eval('[popover="manual"] > a > img', el => el.src);
    const modalLink = await page.$eval('[popover="manual"] > a', el => el.href);
    expect(modalImage).toBeTruthy();
    expect(modalLink).toBeTruthy();
  });
});
