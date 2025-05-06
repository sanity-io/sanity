import {type JSX} from 'react'

const errorHandlerScript = `
;(function () {
  // The error channel is provided so that error handling can be delegated to a view component.
  // If there is a subscriber to the error channel at the time the error happens, the error will be pushed to the subscriber instead of handled here.
  var errorChannel = (function () {
    var subscribers = Object.create(null)
    var nextId = 0
    function subscribe(subscriber) {
      var id = nextId++
      subscribers[id] = subscriber
      return function unsubscribe() {
        delete subscribers[id]
      }
    }

    function publish(event) {
      for (var id in subscribers) {
        if (Object.hasOwn(subscribers, id)) {
          subscribers[id](event)
        }
      }
    }
    return {
      subscribers,
      publish,
      subscribe
    }
  })()

  // NOTE: Store the error channel instance in the global scope so that the Studio application can
  // access it and subscribe to errors.
  window.__sanityErrorChannel = {
    subscribe: errorChannel.subscribe
  }

  function _handleError(event) {
    // If there are error channel subscribers, then we assume they will own error rendering,
    // and we defer to them (no console error).
    if (Object.keys(errorChannel.subscribers).length > 0) {
      errorChannel.publish(event)
    } else {
      _renderErrorOverlay(event)
    }
  }

  var ERROR_BOX_STYLE = [
    'background: #fff',
    'border-radius: 6px',
    'box-sizing: border-box',
    'color: #121923',
    'flex: 1',
    "font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Liberation Sans',Helvetica,Arial,system-ui,sans-serif",
    'font-size: 16px',
    'line-height: 21px',
    'margin: 0 auto',
    'max-width: 960px',
    'overflow: auto',
    'padding: 20px',
    'width: 100%',
  ].join(';')

  var ERROR_CODE_STYLE = [
    'color: #972E2A',
    "font-family: -apple-system-ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace",
    'font-size: 13px',
    'line-height: 17px',
    'margin: 0',
  ].join(';')

  function _renderErrorOverlay(event) {
    var errorElement = document.querySelector('#__sanityError') || document.createElement('div')
    var error = event.error
    var colno = event.colno
    var lineno = event.lineno
    var filename = event.filename

    errorElement.id = '__sanityError'
    errorElement.innerHTML = [
      '<div style="' + ERROR_BOX_STYLE + '">',
      '<div style="font-weight: 700;">Uncaught error: ' + error.message + '</div>',
      '<div style="color: #515E72; font-size: 13px; line-height: 17px; margin: 10px 0;">' +
        filename +
        ':' +
        lineno +
        ':' +
        colno +
        '</div>',
      '<pre style="' + ERROR_CODE_STYLE + '">' + error.stack + '</pre>',
      '</div>',
    ].join('')

    errorElement.style.position = 'fixed'
    errorElement.style.zIndex = 1000000
    errorElement.style.top = 0
    errorElement.style.left = 0
    errorElement.style.right = 0
    errorElement.style.bottom = 0
    errorElement.style.padding = '20px'
    errorElement.style.background = 'rgba(16,17,18,0.66)'
    errorElement.style.display = 'flex'
    errorElement.style.alignItems = 'center'
    errorElement.style.justifyContent = 'center'

    document.body.appendChild(errorElement)
  }

  // Error listener
  window.addEventListener('error', (event) => {
    _handleError({
      type: 'error',
      error: event.error,
      lineno: event.lineno,
      colno: event.colno,
      filename: event.filename
    })
  })

  // Error listener
  window.addEventListener('unhandledrejection', (event) => {
    _handleError({
      type: 'rejection',
      error: event.reason
    })
  })
})()
`

/** @internal */
export function GlobalErrorHandler(): JSX.Element {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{__html: errorHandlerScript}} />
}
