/* eslint-disable no-var */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable prefer-template */

;(function () {
  var _caughtErrors = []

  var errorChannel = (function () {
    var subscribers = []

    function publish(msg) {
      for (var i = 0; i < subscribers.length; i += 1) {
        subscribers[i](msg)
      }
    }

    function subscribe(subscriber) {
      subscribers.push(subscriber)

      return function () {
        var idx = subscribers.indexOf(subscriber)

        if (idx > -1) {
          subscribers.splice(idx, 1)
        }
      }
    }

    return {publish, subscribe, subscribers}
  })()

  // NOTE: Store the error channel instance in the global scope so that the Studio application can
  // access it and subscribe to errors.
  window.__sanityErrorChannel = {
    subscribe: errorChannel.subscribe,
  }

  function _nextTick(callback) {
    setTimeout(callback, 0)
  }

  function _handleError(error, params) {
    _nextTick(function () {
      // - If there are error channel subscribers, then we notify them (no console error).
      // - If there are no subscribers, then we log the error to the console and render the error overlay.
      if (errorChannel.subscribers.length) {
        errorChannel.publish({error, params})
      } else {
        console.error(error)

        _renderErrorOverlay(error, params)
      }
    })
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

  function _renderErrorOverlay(error, params) {
    var errorElement = document.querySelector('#__sanityError') || document.createElement('div')
    var colno = params.event.colno
    var lineno = params.event.lineno
    var filename = params.event.filename

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

  // NOTE:
  // Yes – we're attaching 2 error listeners below 👀
  // This is because React makes the same error throw twice (in development mode).
  // See: https://github.com/facebook/react/issues/10384

  // Error listener #1
  window.onerror = function (event, source, lineno, colno, error) {
    _nextTick(function () {
      if (_caughtErrors.indexOf(error) !== -1) return

      _caughtErrors.push(error)

      _handleError(error, {
        event,
        lineno,
        colno,
        source,
      })

      _nextTick(function () {
        var idx = _caughtErrors.indexOf(error)

        if (idx > -1) _caughtErrors.splice(idx, 1)
      })
    })

    // IMPORTANT: this callback must return `true` to prevent the error from being rendered in
    // the browser’s console.
    return true
  }

  // Error listener #2
  window.addEventListener('error', function (event) {
    if (_caughtErrors.indexOf(event.error) !== -1) return true

    _caughtErrors.push(event.error)

    _handleError(event.error, {
      event,
      lineno: event.lineno,
      colno: event.colno,
    })

    _nextTick(function () {
      _nextTick(function () {
        var idx = _caughtErrors.indexOf(event.error)

        if (idx > -1) _caughtErrors.splice(idx, 1)
      })
    })

    return true
  })
})()
