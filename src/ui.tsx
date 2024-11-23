/** IGB-Field
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { openOrNewProject, projectWin } from './projects'
//import * as bootstrap from 'bootstrap'
//import { takePicture } from './camera'
//import * as location from './location'
import { assert } from './utils'
//import * as share from './share'
import { jsx } from './jsx-dom'
import { i18n } from './i18n'

export async function init() {
  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  assert(htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement)

  const openProj = async (event: MouseEvent): Promise<void> => {
    event.preventDefault()
    const selProj = await openOrNewProject()
    if (selProj)
      htmlMain.replaceChildren(await projectWin(selProj))
  }

  const navProjects = <a class="nav-link active" aria-current="page" href="#">{i18n.t('projects')}</a>
  navbarMain.appendChild(<div class="navbar-nav">
    {navProjects}
    <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#aboutDialog" onclick={(e:Event)=>e.preventDefault()}>{i18n.t('about')}</a>
  </div>)
  navProjects.addEventListener('click', openProj)

  const btnOpenProject = <button class="btn btn-primary">{i18n.t('open-project')}</button>
  btnOpenProject.addEventListener('click', openProj)
  htmlMain.replaceChildren(
    <div class="container rounded border text-center mt-5 px-2 py-4">
      {i18n.t('no-project-open')} <hr class="my-3" /> {btnOpenProject}
    </div>)
}

/*export async function test() {
  const dummy = <div><h1>{i18n.t('hello-world')}</h1></div>
  await location.query()
  //location.start()
  dummy.appendChild(<button onclick={async () => await share.shareCsv('test.csv', new ArrayBuffer(0))}>Share Test</button>)
  dummy.appendChild(<button onclick={async () => await share.downloadCsv('test.csv', new ArrayBuffer(0))}>Download</button>)
  dummy.appendChild(<button onclick={takePicture}>Take Picture</button>)
  return dummy
}*/
