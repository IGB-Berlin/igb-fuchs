import { test, expect } from '@playwright/test'

test('correct title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/IGB-FUCHS/)
})
