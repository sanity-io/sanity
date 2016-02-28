import 'babel-polyfill'

import domready from 'domready'
import React from 'react'
import ReactDOM from 'react-dom'
import Demo from '../components/Demo'
import Debug from 'debug'

Debug.disable('*')

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}


domready(() => {
  ReactDOM.render(<Demo />, document.getElementById('main'))
})
