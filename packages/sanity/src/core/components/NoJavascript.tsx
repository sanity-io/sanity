import i18n from 'i18next'
import k from './../../i18n/keys'
import React from 'react'

const NoJsStyles = `
.sanity-app-no-js__root {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: #fff;
}

.sanity-app-no-js__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: helvetica, arial, sans-serif;
}
`

/** @internal */
export function NoJavascript() {
  return (
    <noscript>
      <div className="sanity-app-no-js__root">
        <div className="sanity-app-no-js__content">
          <style type="text/css">{NoJsStyles}</style>
          <h1>{i18n.t(k.JAVASCRIPT_DISABLED)}</h1>
          <p>
            {i18n.t(k.PLEASE)}{' '}
            <a href="https://www.enable-javascript.com/">{i18n.t(k.ENABLE_JAVASCRIPT)}</a>{' '}
            {i18n.t(k.IN_YOUR_BROWSER_AN)}
          </p>
        </div>
      </div>
    </noscript>
  )
}
