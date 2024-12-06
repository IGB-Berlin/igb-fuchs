/** This file is part of IGB-FUCHS.
 *
 * => The contents of this file are heavily borrowed from:
 * https://medium.com/front-end-weekly/vanilla-jsx-28ff15e82de8
 * https://lwebapp.com/en/post/custom-jsx
 *
 * Other content:
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

type Props = Record<string, string|EventListener|boolean|number> | null
type Children = (JSX.Element | string)[]
type Tag = string | ((props: Props, children: Children) => JSX.Element)

export function jsxFragment(_props :Props, ...children :Children) :Children {
  return children
}

export function jsx(tag: Tag, props: Props, ...children: Children) :JSX.Element {
  if (typeof tag === 'function')
    return tag(props, children)
  const el = document.createElement(tag)
  Object.entries(props || {}).forEach(([key, val]) => {
    if ( key.startsWith('__') )
      return  // ignore
    else if ( key.startsWith('on') && key.toLowerCase() in window && typeof val === 'function' )
      el.addEventListener(key.toLowerCase().substring(2), val)
    else if ( typeof val === 'string' || typeof val === 'number' ) {
      if ( ( key === 'className' || key==='class' ) && typeof val === 'string' )
        el.classList.add(...val.split(/\s+/).flatMap(s => s && s.trim() ? [s.trim()] : []))
      else
        el.setAttribute(key, val.toString())
    }
    else if ( typeof val === 'boolean' ) {
      el.setAttribute(key, key)
    }
    else throw new Error(`can't handle ${key}=${val.toString()} (type=${typeof val})`)
  })
  const appendChild = (parent :Node, child :Node|Node[]|string) => {
    if (child instanceof Node)
      parent.appendChild(child)
    else if (Array.isArray(child))
      child.forEach(ch => appendChild(parent, ch))
    else  // string
      parent.appendChild(document.createTextNode(child))
  }
  children.forEach( child => appendChild(el, child) )
  return el
}

function assertInstance<T>(obj :unknown, t :new()=>T) :asserts obj is T {
  if (!(obj instanceof t)) throw new Error(`Expected ${String(obj)} to be a ${t.toString()}, but it is ${typeof obj}`)
}
/** Cast the given HTMLElement to the specified subclass.
 *
 * This is a workaround for the fact that our JSX.IntrinsicElements doesn't contain any type information.
 * Porting the type information over from React seems to be too big of a task at the moment.
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts
 */
export function safeCastElement<T extends HTMLElement>(t :new()=>T, e :HTMLElement) :T {
  assertInstance(e, t)
  return e
}
