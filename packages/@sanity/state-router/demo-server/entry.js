import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import Main from './components/Main'
import {createRoute, resolveStateFromPath, createScope} from '../src'
import RouterProvider from '../src/components/RouterProvider'
import {createHistory} from 'history'

const rootRoute = createRoute('/some/basepath/*', [
  createScope('product', createRoute('/products/:id/*', [
    createRoute('/:detailView')
  ])),
  createRoute('/users/:userId', params => {
    if (params.userId === 'me') {
      return createRoute('/:profileSection')
    }
  })
])

const history = createHistory()

function handleNavigate(nextUrl, {replace} = {}) {
  if (replace) {
    history.replace(nextUrl)
  } else {
    history.push(nextUrl)
  }
}

function render(location) {
  ReactDOM.render((
    <RouterProvider router={rootRoute} onNavigate={handleNavigate} state={resolveStateFromPath(rootRoute, location.pathname)} location={location}>
      <Main />
    </RouterProvider>
  ), document.getElementById('main'))
}
render(document.location)
history.listen(() => render(document.location))

