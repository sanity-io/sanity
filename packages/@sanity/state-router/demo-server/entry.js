import React from 'react'
import ReactDOM from 'react-dom'
import Main from './components/Main'
import route from '../src/route'
import RouterProvider from '../src/components/RouterProvider'
import createHistory from 'history/createBrowserHistory'
import NotFound from './components/NotFound'

const router = route('/omg/lol', [
  route.scope('product', '/products/:id', [
    route('/:detailView'),
    route('/user/:userId')
  ]),
  route('/users/:userId', params => {
    if (params.userId === 'me') {
      return route('/:profileSection')
    }
  }),
  route.intents('/intents2')
])

const history = createHistory()

function handleNavigate(nextUrl, {replace} = {}) {
  if (replace) {
    history.replace(nextUrl)
  } else {
    history.push(nextUrl)
  }
}

function render(state, pathname) {
  ReactDOM.render((
    <RouterProvider router={router} onNavigate={handleNavigate} state={state}>
      {router.isNotFound(pathname) ? <NotFound pathname={pathname} /> : <Main />}
    </RouterProvider>
  ), document.getElementById('main'))
}

if (router.isRoot(location.pathname)) {
  const basePath = router.getBasePath()
  if (basePath !== location.pathname) {
    history.replace(basePath)
  }
}

const intentHandlers = []
intentHandlers.push({
  canHandle: (intent, params) => intent === 'open' && params.type === 'product',
  resolveRedirectState(intent, params) {
    return {product: {id: params.id}}
  }
})

function checkPath() {
  const pathname = document.location.pathname
  const state = router.decode(pathname)
  if (state && state.intent) {
    // get intent redirect url
    const handler = intentHandlers.find(candidate => candidate.canHandle(state.intent, state.params))
    if (handler) {
      handleNavigate(router.encode(handler.resolveRedirectState(state.intent, state.params)), {replace: true})
      return
    }
    console.log('No intent handler for intent "%s" with params %o', state.intent, state.params)
  }
  render(state, pathname)
}

checkPath()
history.listen(checkPath)
