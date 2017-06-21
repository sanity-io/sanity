import React from 'react'
import ReactDOM from 'react-dom'
import Root from 'part:@sanity/base/sanity-root'
import {AppContainer} from 'react-hot-loader'

function render(RootComponent) {
  ReactDOM.render(
    <AppContainer><RootComponent /></AppContainer>,
    document.getElementById('sanity')
  )
}

render(Root)

if (module.hot) {
  module.hot.accept('part:@sanity/base/sanity-root', () => {
    const nextMod = require('part:@sanity/base/sanity-root')
    const NextRoot = nextMod && nextMod.__esModule ? nextMod.default : nextMod
    render(NextRoot)
  })
}
