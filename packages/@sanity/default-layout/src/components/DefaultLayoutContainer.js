import React from 'react'
import DefaultLayout from './DefaultLayout'
import locationStore from 'part:@sanity/base/location'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from 'part:@sanity/base/router'
import NotFound from './NotFound'
import getOrderedTools from '../util/getOrderedTools'
import rootRouter from '../defaultLayoutRouter'

function maybeHandleIntent(urlStateEvent) {
  if (urlStateEvent.state.intent) {
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

class DefaultLayoutContainer extends React.PureComponent {
  state = {
  }

  componentWillMount() {
    this.pathSubscription = locationStore
      .state
      .map(decodeUrlState)
      .map(maybeHandleIntent)
      .filter(Boolean)
      .subscribe({next: event => this.setState({urlState: event.state, isNotFound: event.isNotFound})})
  }

  componentWillUnmount() {
    this.pathSubscription.unsubscribe()
  }

  handleNavigate(newUrl, options) {
    locationStore.actions.navigate(newUrl, options)
  }

  render() {
    const {urlState, isNotFound} = this.state
    const tools = getOrderedTools()

    if (urlState.intent) {
      // whoops could not handle intent
      return (
        <div>No tool can handle the intent:{' '}
          <strong>{JSON.stringify(urlState.intent)}</strong>
          {' '} with parameters <pre>{JSON.stringify(urlState.params)}</pre>
        </div>
      )
    }

    const router = (
      <RouterProvider router={rootRouter} state={urlState} onNavigate={this.handleNavigate}>
        {isNotFound ? <NotFound /> : <DefaultLayout tools={tools} />}
      </RouterProvider>
    )

    if (LoginWrapper) {
      return <LoginWrapper>{router}</LoginWrapper>
    }
    return router
  }
}

export default DefaultLayoutContainer
