import React from 'react'
import DefaultLayout from './DefaultLayout'
import locationStore from 'part:@sanity/base/location'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from 'part:@sanity/base/router'
import NotFound from './NotFound'
import getOrderedTools from '../util/getOrderedTools'
import rootRouter from '../defaultLayoutRouter'

function maybeHandleIntent(urlStateEvent) {
  if (urlStateEvent.state && urlStateEvent.state.intent) {
    const {intent, params} = urlStateEvent.state
    const matchingTool = getOrderedTools().find(tool => tool.canHandleIntent && tool.canHandleIntent(intent, params))
    if (matchingTool) {
      const toolState = matchingTool.getIntentState(intent, params)
      const state = {
        tool: matchingTool.name,
        [matchingTool.name]: toolState
      }
      const redirectUrl = rootRouter.encode(state)
      locationStore.actions.navigate(redirectUrl, {replace: true})
      return null
    }
    return {
      isNotFound: true,
      intent: {name: intent, params}
    }

  }
  return urlStateEvent
}

function decodeUrlState(locationEvent) {
  return {
    type: locationEvent.type,
    state: rootRouter.decode(location.pathname),
    isNotFound: rootRouter.isNotFound(location.pathname)
  }
}

export default class DefaultLayoutContainer extends React.PureComponent {
  state = {}

  componentWillMount() {
    this.pathSubscription = locationStore
      .state
      .map(decodeUrlState)
      .map(maybeHandleIntent)
      .filter(Boolean)
      .subscribe({
        next: event => this.setState({
          urlState: event.state,
          isNotFound: event.isNotFound,
          intent: event.intent
        })
      })
  }

  componentWillUnmount() {
    this.pathSubscription.unsubscribe()
  }

  handleNavigate(newUrl, options) {
    locationStore.actions.navigate(newUrl, options)
  }

  render() {
    const {intent, urlState, isNotFound} = this.state
    const tools = getOrderedTools()

    const content = isNotFound
      ? (
        <NotFound>{
          intent && (
            <div>
              No tool can handle the intent:
              {' '} <strong>{intent.name}</strong> {' '}
              with parameters <pre>{JSON.stringify(intent.params)}</pre>
            </div>
          )}
        </NotFound>
      ) : <DefaultLayout tools={tools} />

    const router = (
      <RouterProvider router={rootRouter} state={urlState} onNavigate={this.handleNavigate}>
        {content}
      </RouterProvider>
    )

    return LoginWrapper ? <LoginWrapper>{router}</LoginWrapper> : router
  }
}

