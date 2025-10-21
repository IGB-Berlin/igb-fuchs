// @ts-check
/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * IGB-FUCHS is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * IGB-FUCHS is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * IGB-FUCHS. If not, see <https://www.gnu.org/licenses/>.
 */
import { defineConfig, devices } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: '.',  // recursively search this directory for tests according to the following regex
  // Jest uses *.test.ts and *.spec.ts, so we configure Playwright to use *.play.ts
  testMatch: /[^/]+\.play\.ts$/,  // https://playwright.dev/docs/api/class-testconfig#test-config-test-match
  fullyParallel: true,  // Run tests in files in parallel
  forbidOnly: !!process.env['CI'],  // Fail the build on CI if you accidentally left test.only in the source code.
  retries: process.env['CI'] ? 2 : process.env['CODESPACES'] ? 1 : 0,  // Retry on CI and Codespaces only
  workers: process.env['CI'] ? 1 : process.env['CODESPACES'] ? 2 : 5,  // Opt out of parallel tests on CI; limit in Codespaces.
  reporter: 'list',  // https://playwright.dev/docs/test-reporters
  use: {  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions
    baseURL: 'http://localhost:1234',  // Base URL to use in actions like `await page.goto('/')`.
    trace: 'on-first-retry',  // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    testIdAttribute: 'data-test-id',
    // https://playwright.dev/docs/emulation
    locale: 'en-US',
    timezoneId: 'Europe/Berlin',
    geolocation: { latitude: 52.516312, longitude: 13.377657 },
    permissions: ['geolocation'],
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'],  }, },
    { name: 'Firefox',  use: { ...devices['Desktop Firefox'], }, },
    { name: 'WebKit',   use: { ...devices['Desktop Safari'],  }, },
    { name: 'Mobile Chrome',  use: { ...devices['Pixel 5'],   }, },
    { name: 'Mobile Safari',  use: { ...devices['iPhone 12'], }, },
  ],
  webServer: {
    // NOTE this command only runs the server - need to run `npm run build` or `npm start` first!
    command: 'npx serve --no-port-switching --no-clipboard --listen tcp://localhost:1234 dist',
    url: 'http://localhost:1234',
    reuseExistingServer: !process.env['CI'],
    gracefulShutdown: { signal: 'SIGINT', timeout: 500 },
  },
})
