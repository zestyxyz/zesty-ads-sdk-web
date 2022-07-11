// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'yarn serve',
    url: 'http://localhost:8080/',
    timeout: 180 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  retries: 10,
  timeout: 15000
};

module.exports = config;