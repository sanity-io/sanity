// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {isEqual} from 'lodash'
import React from 'react'
import {Subscription} from 'rxjs'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from '@sanity/base/router'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import * as urlStateStore from './datastores/urlState'
import getOrderedTools from './util/getOrderedTools'
import rootRouter, {maybeRedirectToBase} from './router'
import DefaultLayout from './DefaultLayout'
import NotFound from './main/NotFound'

const handleNavigate = urlStateStore.navigate

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

interface State {
  intent?: {
    name: string
    params: {[key: string]: string}
  }
  urlState?: Record<string, unknown>
  isNotFound?: boolean
}

class DefaultLayoutRoot extends React.PureComponent<Props, State> {
  state: State = {}

  urlStateSubscription: Subscription | null = null

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    maybeRedirectToBase()

    this.urlStateSubscription = urlStateStore.state.subscribe({
      next: (event) => {
        let urlState = this.state.urlState
        let isNotFound = this.state.isNotFound
        let intent = this.state.intent

        if (!isEqual(this.state.urlState, event.state)) {
          urlState = event.state
        }

        if (!isEqual(this.state.isNotFound, event.isNotFound)) {
          isNotFound = event.isNotFound
        }

        if (!isEqual(this.state.intent, event.intent)) {
          intent = event.intent
        }

        const urlStateEqual = this.state.urlState === urlState
        const isNotFoundEqual = this.state.isNotFound === isNotFound
        const intentEqual = this.state.intent === intent

        if (!urlStateEqual || !isNotFoundEqual || !intentEqual) {
          this.setState({urlState, isNotFound, intent})
        }
      },
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

export default DefaultLayoutRoot
