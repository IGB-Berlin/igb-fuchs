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
import { Tooltip } from 'bootstrap'

/** A wrapper for Bootstrap's Tooltip class to add some necessary features. */
export class MyTooltip {
  private readonly tip
  private readonly el
  private visible = false
  constructor(el :HTMLElement) {
    const t = el.title
    this.el = el
    el.title = '-'  // needs a title or Tooltip won't init
    this.tip = new Tooltip(el)  // converts attr `title` to `data-bs-title`
    this.update(t)
    // because apparently the BS Tooltip API doesn't have a property for this, track it ourselves
    // (supposedly, one way to track visibility is `this.el.getAttribute('aria-describedby')`, but I don't trust that)
    el.addEventListener('shown.bs.tooltip', () => this.visible = true)
    el.addEventListener('hidden.bs.tooltip', () => this.visible = false)
  }
  update(text :string|null|undefined) {
    if ( text && text.trim().length ) {
      this.el.setAttribute('data-bs-title', text)
      this.tip.setContent({ '.tooltip-inner': text })
      this.tip.enable()
    }
    else {
      this.el.setAttribute('data-bs-title', '-')
      this.tip.disable()
    }
  }
  hide() { this.tip.hide() }
  async close() {
    if (this.visible)
      // can't dispose when visible
      await new Promise<void>(resolve => {
        this.el.addEventListener('hidden.bs.tooltip', () => resolve() )
        this.tip.hide()
      })
    this.tip.dispose()
  }
}