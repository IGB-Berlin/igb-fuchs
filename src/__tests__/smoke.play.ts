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
import { test, expect } from '@playwright/test'

test('smoke test', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/IGB-FUCHS/)  // basic HTML
  const betaWarningBtn = page.getByRole('button', { name: 'I understand' })  // alpha version warning
  await expect( betaWarningBtn ).toBeVisible()
  await betaWarningBtn.click()
  await expect( betaWarningBtn ).toBeHidden()
  await expect( page.getByRole('button', { name: 'Sampling Logs' }) ).toBeVisible()  // JS-generated content
})

test.describe('German', () => {
  test.use({ locale: 'de-DE' })
  test('smoke test DE', async ({ page }) => {  // same test as above, just in German
    await page.goto('/')
    await expect(page).toHaveTitle(/IGB-FUCHS/)  // basic HTML
    const betaWarningBtn = page.getByRole('button', { name: 'Ich verstehe' })  // alpha version warning
    await expect( betaWarningBtn ).toBeVisible()
    await betaWarningBtn.click()
    await expect( betaWarningBtn ).toBeHidden()
    await expect( page.getByRole('button', { name: 'Messprotokolle' }) ).toBeVisible()  // JS-generated content
  })
})
