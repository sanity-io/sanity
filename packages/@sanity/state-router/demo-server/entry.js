import React from 'react'
import ReactDOM from 'react-dom'
import Main from './components/Main'
import route from '../src/route'
import RouterProvider from '../src/components/RouterProvider'
import createHistory from 'history/createBrowserHistory'
import NotFound from './components/NotFound'

const router = route('/omg/lol', [
  route.scope('product', '/products/:id', route('/:detailView')),
  route('/users/:userId', params => {
    if (params.userId === 'me') {
      return route('/:profileSection')
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
    <RouterProvider router={router} onNavigate={handleNavigate} state={router.decode(location.pathname)}>
      {router.isNotFound(location.pathname) ? <NotFound pathname={location.pathname} /> : <Main />}
    </RouterProvider>
  ), document.getElementById('main'))
}

if (router.isRoot(location.pathname)) {
  const basePath = router.getBasePath()
  if (basePath !== location.pathname) {
    history.replace(basePath)
  }
}

render(document.location)
history.listen(() => render(document.location))

