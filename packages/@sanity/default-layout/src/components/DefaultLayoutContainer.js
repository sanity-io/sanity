import React from 'react'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from 'part:@sanity/base/router'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import * as urlStateStore from '../datastores/urlState'
import getOrderedTools from '../util/getOrderedTools'
import rootRouter, {maybeRedirectToBase} from '../defaultLayoutRouter'
import DefaultLayout from './DefaultLayout'
import NotFound from './NotFound'
import ComposedProvider from './ComposedProvider'

const handleNavigate = urlStateStore.navigate

/* Extract all providers into an array */
const getAllProviders = tools =>
  tools.reduce((acc, tool) => {
    if (!tool.providers || !tool.providers.length) return acc
    return [...acc, ...tool.providers]
  }, [])

export default class DefaultLayoutContainer extends React.PureComponent {
  state = {}

  componentWillMount() {
    maybeRedirectToBase()

    this.urlStateSubscription = urlStateStore.state.subscribe({
      next: event =>
        this.setState({
          urlState: event.state,
          isNotFound: event.isNotFound,
          intent: event.intent
        })
    })
  }

  componentWillUnmount() {
    this.urlStateSubscription.unsubscribe()
  }

  renderInner() {
    const {intent, urlState, isNotFound} = this.state
    const tools = getOrderedTools()

    const content = isNotFound ? (
      <NotFound>
        {intent && (
          <div>
            No tool can handle the intent: <strong>{intent.name}</strong> with parameters{' '}
            <pre>{JSON.stringify(intent.params)}</pre>
          </div>
        )}
      </NotFound>
    ) : (
      <DefaultLayout tools={tools} />
    )

    const router = (
      <RouterProvider router={rootRouter} state={urlState} onNavigate={handleNavigate}>
        {content}
      </RouterProvider>
    )

    return LoginWrapper ? (
      <LoginWrapper LoadingScreen={<AppLoadingScreen text="Logging in" />}>{router}</LoginWrapper>
    ) : (
      router
    )
  }

  render() {
    const tools = getOrderedTools()
    const providers = getAllProviders(tools)
    return <ComposedProvider wrappers={providers}>{this.renderInner()}</ComposedProvider>
  }
}
