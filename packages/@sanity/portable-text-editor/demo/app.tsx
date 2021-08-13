import React from 'react'

import {studioTheme, ThemeProvider} from '@sanity/ui'
import ReactDOM from 'react-dom'
import {Standalone} from './components/Standalone'

ReactDOM.render(<App />, document.getElementById('root'))

export function App() {
  return (
    <ThemeProvider theme={studioTheme}>
      <Standalone />
    </ThemeProvider>
  )
}
