// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'yarn serve',
    url: 'http://127.0.0.1:8080/',
    timeout: 180 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  retries: 3,
  timeout: 120000
};

module.exports = config;