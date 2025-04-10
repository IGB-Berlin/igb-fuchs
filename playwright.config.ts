// @ts-check
import { defineConfig, devices } from '@playwright/test'

/** See https://playwright.dev/docs/test-configuration */
export default defineConfig({
  testDir: './e2e-tests',
  /** Jest uses roughly `*.(test|spec).[jt]s`, so we'll use `.play.ts` for Playwright tests */
  testMatch: /.*\.play\.[cm]?[jt]sx?/,  // https://playwright.dev/docs/api/class-testconfig#test-config-test-match
  fullyParallel: true,  // Run tests in files in parallel
  forbidOnly: !!process.env['CI'],  // Fail the build on CI if you accidentally left test.only in the source code.
  retries: process.env['CI'] ? 2 : 0,  // Retry on CI only
  workers: process.env['CI'] ? 1 : 5,  // Opt out of parallel tests on CI.
  reporter: 'list',  // https://playwright.dev/docs/test-reporters
  use: {  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions
    baseURL: 'http://localhost:1234',  // Base URL to use in actions like `await page.goto('/')`.
    trace: 'on-first-retry',  // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] },  },
    { name: 'Firefox',  use: { ...devices['Desktop Firefox'] }, },
    { name: 'WebKit',   use: { ...devices['Desktop Safari'] },  },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] },    },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] },  },
  ],
  webServer: {
    // NOTE this command only serves - need to run `npm run build` or `npm start` first!
    command: 'npx serve --no-port-switching --no-clipboard --listen tcp://localhost:1234 dist',
    url: 'http://localhost:1234',
    reuseExistingServer: !process.env['CI'],
    gracefulShutdown: { signal: 'SIGINT', timeout: 500 },
  },
})
