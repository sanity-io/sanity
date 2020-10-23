import {Observable} from 'rxjs'

const DEFAULT_FEATURES = [
  'scrollbars=yes',
  'toolbar=no',
  'location=yes',
  'titlebar=yes',
  'directories=no',
  'status=yes',
  'menubar=no',
]

const toFeatureStr = (features) => Object.keys(features).map((name) => `${name}=${features[name]}`)

const openWindow = (url, target, features) => {
  const win = window.open(url, target, features)
  if (win === null) {
    throw new Error('Unable to open window')
  }
  return win
}
const waitForEnd = (win) =>
  new Observable((subscriber) => {
    const onMessage = (ev) => {
      if (ev.data === 'close') {
        subscriber.next()
        subscriber.complete()
      }
    }
    let checkCancelTimer
    const checkCancel = () => {
      if (win.closed) {
        subscriber.error(new Error('Login window closed by user'))
      } else {
        checkCancelTimer = setTimeout(checkCancel, 500)
      }
    }
    window.addEventListener('message', onMessage)
    checkCancel()
    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(checkCancelTimer)
    }
  })

export const openPopup = (url, positionFeatures) => {
  return new Observable((subscriber) => {
    const win = openWindow(
      // note: we need to start with about:blank here as MS Edge will throw
      // when attempting to call .focus() or .moveTo() on a window with an untrusted origin
      'about:blank',
      '_blank',
      DEFAULT_FEATURES.concat(positionFeatures ? toFeatureStr(positionFeatures) : []).join(',')
    )
    if (positionFeatures) {
      win.moveTo(positionFeatures.left, positionFeatures.top)
    }
    win.focus()
    // we are done with calling .moveTo() and .focus() so we can now navigate to the url
    win.location.href = url
    const subscription = waitForEnd(win).subscribe(subscriber)
    return () => {
      win.close()
      subscription.unsubscribe()
    }
  })
}

export const openCenteredPopup = (url, size) => {
  const screen = window.screen

  const centerX = screen.width - size.width
  const centerY = screen.height - size.height

  const top = centerY > 0 ? centerY / 2 : 0
  const left = centerX > 0 ? centerX / 2 : 0

  return openPopup(url, {height: size.height, width: size.width, top, left})
}
