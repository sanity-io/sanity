import React from 'react'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from 'part:@sanity/base/router'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import * as urlStateStore from './datastores/urlState'
import getOrderedTools from './util/getOrderedTools'
import rootRouter, {maybeRedirectToBase} from './router'
import DefaultLayout from './DefaultLayout'
import NotFound from './main/NotFound'

const handleNavigate = urlStateStore.navigate

export default class DefaultLayoutContainer extends React.PureComponent {
  state = {}

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
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

  render() {
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
}
