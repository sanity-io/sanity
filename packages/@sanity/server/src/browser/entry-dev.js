import React from 'react'
import ReactDOM from 'react-dom'
import Root from 'part:@sanity/base/root'
import {AppContainer} from 'react-hot-loader'

function render(RootComponent) {
  ReactDOM.render(
    <AppContainer><RootComponent /></AppContainer>,
    document.getElementById('sanity')
  )
}

render(Root)

if (module.hot) {
  module.hot.accept('part:@sanity/base/root', () => {
    const nextMod = require('part:@sanity/base/root')
    const NextRoot = nextMod && nextMod.__esModule ? nextMod['default'] : nextMod
    render(NextRoot)
  })
}
