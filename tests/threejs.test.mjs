import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/threejs/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Three.js Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    const bannerCount = await page.evaluate(() => window.scene?.children?.length);
    expect(bannerCount).toBe(4); // First child is camera
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[1]?.banner?.src != null);
    const banner1 = await page.evaluate(() => window.scene.children[1].banner.src);
    expect(banner1.split('/').pop()).toBe('zesty-ad-square.png');
  });

  test('The billboard banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[2]?.banner?.src != null);
    const banner2 = await page.evaluate(() => window.scene.children[2].banner.src);
    expect(banner2.split('/').pop()).toBe('zesty-default-billboard.png');
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[3]?.banner?.src != null);
    const banner3 = await page.evaluate(() => window.scene.children[3].banner.src);
    expect(banner3.split('/').pop()).toBe('zesty-default-mobile-phone-interstitial.png');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => window.scene.children[1].banner.url);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => window.scene.children[1].onClick())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('Three.js Test');
  });
});

test.describe('Modal', () => {
  test('An ad modal is created when the modal trigger event is fired @skip', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children[1]?.banner?.src != null);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('lose')));
    const modal = await page.waitForSelector('[popover="manual"]');
    expect(modal).toBeTruthy();
    const modalImage = await page.$eval('[popover="manual"] > a > img', el => el.src);
    const modalLink = await page.$eval('[popover="manual"] > a', el => el.href);
    expect(modalImage).toBeTruthy();
    expect(modalLink).toBeTruthy();
  });
});
