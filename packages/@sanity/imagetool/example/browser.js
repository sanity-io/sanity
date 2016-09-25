import 'babel-polyfill'
import Debug from 'debug'
import React from 'react'
import ReactDOM from 'react-dom'
import Demo from './src/Demo'
import history from './src/history'

Debug.disable('')
Debug.enable(process.env.DEBUG)

const DEFAULT_IMAGE_INDEX = '4'

history.listen(render)
render(history.location)

function render(location) {
  const imageIndex = location.pathname.split('/')[1] || DEFAULT_IMAGE_INDEX
  ReactDOM.render(<Demo imageIndex={imageIndex} />, document.getElementById('content'))
}

