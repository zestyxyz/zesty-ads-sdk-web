// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'yarn serve',
    url: 'http://127.0.0.1:8080/',
    timeout: 180 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  retries: process.env.CI ? 3 : 1,
  timeout: 120000,
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined, // Use all available CPUs locally
};

module.exports = config;