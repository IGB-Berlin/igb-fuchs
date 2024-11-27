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
import { jsx, safeCastElement } from './jsx-dom'
import { VALID_KEY_RE } from './storage'
import * as bootstrap from 'bootstrap'
import * as storage from './storage'

const PROJECTS_KEY = 'projects'

export async function projectWin(projId :string) {
  const p = storage.get([PROJECTS_KEY, projId])
  if (!p) throw new Error(`no project with id ${projId}`)
  return <div>{projId}</div>
}

export async function openOrNewProject() {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const projects = storage.list([PROJECTS_KEY])
    let curProj :string|null = null
    let openClicked = false
    let newClicked = false
    const btnNew = <button type="button" class="btn btn-info me-3" data-bs-dismiss="modal" onclick={()=>newClicked=true}>
      <i class="bi-journal-plus" /> New Project</button>
    const btnOpen = <button type="button" class="btn btn-primary" data-bs-dismiss="modal" disabled onclick={()=>openClicked=true}>
      <i class="bi-folder2-open" /> Open</button>
    const clickProj = (event :MouseEvent) => {
      dialog.querySelectorAll('li.list-group-item[data-project]').forEach(el => {
        if (event.target === el) {
          el.classList.add('active')
          curProj = el.getAttribute('data-project')
        } else el.classList.remove('active')
      })
      if (curProj) btnOpen.removeAttribute('disabled')
    }
    const dialog = <div class="modal fade"
      tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="projectModalLabel">Projects</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <ul class="list-group">
              { projects.length ? projects.map(p =>
                <li class="list-group-item cursor-pointer" data-project={p.at(-1)} onclick={clickProj}>{p.at(-1)}</li> )
                : <li class="list-group-item list-group-item-secondary">No projects</li> }
            </ul>
          </div>
          <div class="modal-footer">
            {btnNew}
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi-x-lg"/> Cancel</button>
            {btnOpen}
          </div>
        </div>
      </div>
    </div>
    const NEW_PROJ_ID = '*new'  // something that's not a valid ID otherwise
    document.body.appendChild(dialog)
    const p = await new Promise<string|null>(resolve => {
      const modal = new bootstrap.Modal(dialog)
      dialog.addEventListener('hidden.bs.modal', () => {
        modal.dispose()
        document.body.removeChild(dialog)
        resolve( newClicked ? NEW_PROJ_ID : openClicked ? curProj : null )
      })
      modal.show()
    })
    if (p===NEW_PROJ_ID) {
      const newId = await newProjectDialog()
      if (newId) {
        storage.set([PROJECTS_KEY, newId], JSON.stringify({}))
        return newId
      }
    } else return p
    // else next loop iteration
  }
}

async function newProjectDialog() {
  let newProjId :string|null = null
  let createClicked = false
  const btnCreate = <button type="submit" class="btn btn-info" onclick={()=>createClicked=true}>
    <i class="bi-journal-plus" /> Create</button>
  const inpProjId = safeCastElement(HTMLInputElement,
    <input class="form-control" type="text" pattern={VALID_KEY_RE.source}
      id="newProjectId" required />)
  const formNewProj = safeCastElement(HTMLFormElement, <form novalidate>
    <div class="modal-header">
      <h1 class="modal-title fs-5" id="projectModalLabel">New Project</h1>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <div>
        <label for="newProjectId" class="form-label">Project ID</label>
        {inpProjId}
        <div class="invalid-feedback">Invalid ID</div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
        <i class="bi-x-lg"/> Cancel</button>
      {btnCreate}
    </div>
  </form>)
  const dialog = <div class="modal fade"
    tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-fullscreen-lg-down">
      <div class="modal-content">{formNewProj}</div>
    </div>
  </div>
  document.body.appendChild(dialog)
  return new Promise<string|null>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    formNewProj.addEventListener('submit', event => {
      if (formNewProj.checkValidity()) {
        newProjId = inpProjId.value
        modal.hide()
        return
      }
      formNewProj.classList.add('was-validated')
      event.preventDefault()
      event.stopPropagation()
    })
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve( createClicked ? newProjId : null )
    })
    modal.show()
  })
}
