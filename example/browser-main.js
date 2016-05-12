import 'babel-polyfill'

import domready from 'domready'
import React from 'react'
import ReactDOM from 'react-dom'
import Demo from './components/Demo'
import Debug from 'debug'
import {whyDidYouUpdate} from 'why-did-you-update'

Debug.disable('*')

whyDidYouUpdate(React)

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

domready(() => {
  ReactDOM.render(<Demo />, document.getElementById('main'))
})
