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
import * as bootstrap from 'bootstrap'
import { assert } from './utils'

/* TODO:
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture
 * https://www.dynamsoft.com/codepool/take-high-resolution-photo-in-the-browser.html
 */

export function takePicture() :Promise<Blob|null> {
  const errMsg = <p className="mb-0">Unknown error</p>
  const videoAlert = <div className="alert alert-warning d-none" role="alert">
    <h4 className="alert-heading">Failed to start camera</h4>
    <hr/> {errMsg}
  </div>
  const video = safeCastElement(HTMLVideoElement, <video className="w-100 object-fit-scale"></video>)
  const photo = safeCastElement(HTMLImageElement, <img className="w-100 object-fit-scale d-none"></img>)
  const canvas = safeCastElement(HTMLCanvasElement, <canvas className="d-none"></canvas>)
  const fileInp = safeCastElement(HTMLInputElement,
    <input className="form-control mt-1" type="file" accept="image/*" capture="environment" />)
  const btnCancel = <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"><i className="bi-x-lg"/> Cancel</button>
  const btnRetry = <button className="btn btn-primary" disabled><i className="bi-arrow-counterclockwise"/> Retry</button>
  const btnTake = <button className="btn btn-primary" disabled><i className="bi-camera-fill"/> Take Picture</button>
  const btnAccept = <button className="btn btn-success d-none" data-bs-dismiss="modal"><i className="bi-check-lg"/> Accept</button>
  const dialog = <div
    className="modal fade" tabindex="-1" aria-labelledby="cameraModalLabel"
    data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
    <div className="modal-dialog modal-lg modal-fullscreen-lg-down">
      <div className="modal-content">
        <div className="modal-header">
          <h1 className="modal-title fs-5" id="cameraModalLabel">Take Picture</h1>
        </div>
        <div className="modal-body"> {videoAlert} {video} {photo} {canvas} {fileInp} </div>
        <div className="modal-footer"> {btnCancel} {btnRetry} {btnTake} {btnAccept} </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)

  const endVideo = () => {
    pauseVideo()
    if (video.srcObject) {
      if (video.srcObject instanceof MediaStream) {
        const tracks = video.srcObject.getTracks()
        for (const track of tracks) {
          track.stop()
          video.srcObject.removeTrack(track)
        }
      }
      else if (video.srcObject instanceof MediaSource) {
        const sbs = video.srcObject.sourceBuffers
        for (let i = 0; i < sbs.length; i++) {
          const sb = sbs[i]
          assert(sb)
          try { sb.abort() } catch (_) { /* ignore */}
          video.srcObject.removeSourceBuffer(sb)
        }
        video.srcObject.endOfStream()
      }
      video.srcObject = null
    }
  }
  const playVideo = async () => {
    try {
      //TODO: need to do navigator.mediaDevices.getSupportedConstraints() ?
      video.srcObject = await navigator.mediaDevices.getUserMedia(
        { video: { facingMode: 'environment' }, audio: false })
      await video.play()
    }
    catch (ex) {
      console.warn('Failed to start video', ex)
      errMsg.innerText = String(ex)
      videoAlert.classList.remove('d-none')
      video.classList.add('d-none')
    }
  }
  const pauseVideo = () => {
    video.pause()
    video.classList.add('d-none')
    btnTake.setAttribute('disabled', 'disabled')
  }
  const displayPhoto = () => {
    pauseVideo()
    videoAlert.classList.add('d-none')
    photo.classList.remove('d-none')
    btnRetry.removeAttribute('disabled')
    btnAccept.classList.remove('d-none')
    btnTake.classList.add('d-none')
  }
  dialog.addEventListener('shown.bs.modal', playVideo)
  video.addEventListener('canplay', () => video.classList.remove('d-none') )
  video.addEventListener('playing', () => btnTake.removeAttribute('disabled') )
  let curImage :Blob|null = null
  btnTake.addEventListener('click', async () => {
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
      curImage = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(blob => blob ? resolve(blob) : reject('Unknown error'), 'image/png'))
      photo.src = canvas.toDataURL('image/png')
      displayPhoto()
    }
  })
  fileInp.addEventListener('change', () => {
    if (fileInp.files?.length) {
      const file = fileInp.files[0]
      assert(file)
      curImage = file
      const url = URL.createObjectURL(file)
      const onload = () => {
        URL.revokeObjectURL(url)
        photo.removeEventListener('load', onload)
      }
      photo.addEventListener('load', onload)
      photo.src = url
      displayPhoto()
    }
  })
  let accepted = false
  btnRetry.addEventListener('click', async () => {
    curImage = null
    fileInp.value = ''
    accepted = false
    photo.classList.add('d-none')
    btnAccept.classList.add('d-none')
    btnTake.classList.remove('d-none')
    btnRetry.setAttribute('disabled','disabled')
    await playVideo()
  })
  // I'm not sure why the 'hide.bs.modal' event doesn't always end the video, but it doesn't hurt to play it safe.
  btnAccept.addEventListener('click', () => { endVideo(); accepted = true })
  btnCancel.addEventListener('click', () => { endVideo(); accepted = false })
  dialog.addEventListener('hide.bs.modal', endVideo)

  return new Promise<Blob|null>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve( accepted ? curImage : null )
    })
    modal.show()
  })
}