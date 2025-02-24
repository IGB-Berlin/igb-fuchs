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
import { assert } from './utils'
import { jsx } from './jsx-dom'

const bsColors = ['primary','secondary','info','success','warning','danger'] as const
type BSColor = typeof bsColors[number]

export class Slider {
  readonly el
  private readonly btn
  private readonly textSpan
  constructor(text :string|HTMLElement, callback :()=>void) {
    this.btn = <div class="slider-button rounded-pill text-bg-primary position-absolute top-0 start-0
    d-flex justify-content-center align-items-center overflow-hidden cursor-pointer px-3">
      <i class="bi-arrow-right"/></div>
    this.textSpan = <span>{text}</span>
    this.el = <div class="slider-bar rounded-pill bg-body-tertiary border border-primary-subtle position-relative
      d-flex justify-content-center align-items-center px-3">
      {this.btn}{this.textSpan}</div>
    let isDragging = false
    let isSwiping = false
    let startX = 0
    let currentX = 0
    const update = (clientX :number) => {
      currentX = Math.max(0, Math.min(clientX - startX, this.el.clientWidth - this.btn.clientWidth))
      this.btn.style.transform = `translateX(${currentX}px)`
    }
    const finish = (suppress ?:boolean) => {
      const atEnd = currentX === this.el.clientWidth - this.btn.clientWidth
      currentX = 0
      this.btn.style.transform = 'translateX(0)'
      if ( !suppress && atEnd ) callback()
    }
    const mouseMove = (event :MouseEvent) => { if (isDragging) update(event.clientX) }
    const touchMove = (event :TouchEvent) => {
      if (!isSwiping) return
      if (event.touches.length===1) {
        const touch = event.touches[0]
        assert(touch)
        update(touch.clientX)
      } else touchFinish(true)
    }
    const mouseUp = () => {
      if (!isDragging) return
      document.removeEventListener('mousemove', mouseMove)
      document.removeEventListener('mouseup', mouseUp)
      isDragging = false
      finish()
    }
    const touchEnd = () => touchFinish(false)
    const touchCancel = () => touchFinish(true)
    const touchFinish = (suppress :boolean) => {
      if (!isSwiping) return
      document.removeEventListener('touchmove', touchMove)
      document.removeEventListener('touchend', touchEnd)
      document.removeEventListener('touchcancel', touchCancel)
      isSwiping = false
      finish(suppress)
    }
    this.btn.addEventListener('mousedown', event => {
      if (isDragging||isSwiping) return
      isDragging = true
      startX = event.clientX
      document.addEventListener('mousemove', mouseMove)
      document.addEventListener('mouseup', mouseUp)
    })
    this.btn.addEventListener('touchstart', event => {
      if (isDragging||isSwiping) return
      if (event.touches.length!==1) return
      isSwiping = true
      const touch = event.touches[0]
      assert(touch)
      startX = touch.clientX
      document.addEventListener('touchmove', touchMove)
      document.addEventListener('touchend', touchEnd)
      document.addEventListener('touchcancel', touchCancel)
    })
  }
  setColor(color :BSColor) {
    for(const c of bsColors) {
      this.btn.classList.toggle(`text-bg-${c}`, color===c)
      this.el.classList.toggle(`border-${c}-subtle`, color===c)
    }
  }
  setText(text :string|HTMLElement) {
    if (text instanceof HTMLElement) this.textSpan.replaceChildren(text)
    else this.textSpan.innerText = text
  }
}
