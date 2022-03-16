import {
  IntentParameters,
  NavigateOptions,
  route,
  Router,
  RouterProvider,
  RouterState,
} from '@sanity/state-router'
import {Card, studioTheme, ThemeProvider} from '@sanity/ui'
import {createBrowserHistory as createHistory} from 'history'
import {isPlainObject} from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import {NotFound} from './components/NotFound'
import {Main} from './components/Main'

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

const router: Router = route.create('/omg/lol', [
  route.scope('product', '/products/:id', [
    route.create('/:detailView'),
    route.create('/user/:userId'),
  ]),

  route.create('/users/:userId', (params) => {
    if (params.userId === 'me') {
      return route.create('/:profileSection')
    }

    return undefined
  }),

  route.intents('/intents2'),
])

const history = createHistory()

function handleNavigate(nextUrl: string, {replace}: NavigateOptions = {}) {
  if (replace) {
    history.replace(nextUrl)
  } else {
    history.push(nextUrl)
  }
}

function Root(props: {pathname: string; state: RouterState}) {
  const {pathname, state} = props

  return (
    <ThemeProvider theme={studioTheme}>
      <Card padding={[4, 5, 6, 7, 8]}>
        <RouterProvider router={router} onNavigate={handleNavigate} state={state}>
          {router.isNotFound(pathname) ? <NotFound /> : <Main />}
        </RouterProvider>
      </Card>
    </ThemeProvider>
  )
}

function render(state: RouterState, pathname: string) {
  ReactDOM.render(<Root pathname={pathname} state={state} />, document.getElementById('root'))
}

if (router.isRoot(location.pathname)) {
  const basePath = router.getBasePath()

  if (basePath !== location.pathname) {
    history.replace(basePath)
  }
}

const intentHandlers: {
  canHandle: (intent: string, params: IntentParameters) => boolean
  resolveRedirectState: (intent: string, params: IntentParameters) => RouterState
}[] = []

intentHandlers.push({
  canHandle: (intent: string, params: IntentParameters) => {
    return intent === 'open' && isRecord(params) && params.type === 'product'
  },

  resolveRedirectState(_intent: string, params: IntentParameters) {
    return {product: {id: isRecord(params) ? params.id : undefined}}
  },
})

function checkPath() {
  const pathname = document.location.pathname
  const state = router.decode(pathname) || {}
  const intent = state.intent
  const intentParams = state.params

  if (typeof intent === 'string') {
    // get intent redirect url
    const handler = intentHandlers.find((candidate) => candidate.canHandle(intent, intentParams))

    if (handler) {
      handleNavigate(router.encode(handler.resolveRedirectState(intent, intentParams)), {
        replace: true,
      })
      return
    }

    // eslint-disable-next-line no-console
    console.log('No intent handler for intent "%s" with params %o', intent, intentParams)
  }

  render(state, pathname)
}

checkPath()

history.listen(checkPath)
