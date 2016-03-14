/* eslint-disable no-process-env */
import React from 'react'
import ReactDOM from 'react-dom'
import {Sanity} from '@sanity/base'
import plugins from '@sanity/plugin-loader/plugins'

function render(roles) {
  ReactDOM.render(
    <Sanity roles={roles} />,
    document.getElementById('sanity')
  )
}

if (process.env.NODE_ENV !== 'production') {
  // Hot module reloading for plugins? Yes please.
  if (module.hot) {
    module.hot.accept('@sanity/plugin-loader/plugins', () => {
      render(require('@sanity/plugin-loader/plugins'))
    })
  }
}

render(plugins)
