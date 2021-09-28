// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {isEqual} from 'lodash'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from '@sanity/base/router'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import * as urlStateStore from './datastores/urlState'
import getOrderedTools from './util/getOrderedTools'
import rootRouter, {maybeRedirectToBase} from './router'
import {DefaultLayout} from './defaultLayout'
import {NotFound} from './main'

interface State {
  intent?: {
    name: string
    params: {[key: string]: string}
  }
  urlState?: Record<string, unknown>
  isNotFound?: boolean
}

function DefaultLayoutRoot() {
  const [state, setState] = useState<State>({})
  const tools = getOrderedTools()

  useEffect(() => {
    return () => {
      // reset state on unmount
      setState({})
    }
  }, [])

  useEffect(maybeRedirectToBase, [])

  useEffect(() => {
    const sub = urlStateStore.state.subscribe({
      next: (event) => {
        let urlState = state.urlState
        let isNotFound = state.isNotFound
        let intent = state.intent

        if (!isEqual(state.urlState, event.state)) {
          urlState = event.state
        }

        if (!isEqual(state.isNotFound, event.isNotFound)) {
          isNotFound = event.isNotFound
        }

        if (!isEqual(state.intent, event.intent)) {
          intent = event.intent
        }

        const urlStateEqual = state.urlState === urlState
        const isNotFoundEqual = state.isNotFound === isNotFound
        const intentEqual = state.intent === intent

        if (!urlStateEqual || !isNotFoundEqual || !intentEqual) {
          setState({urlState, isNotFound, intent})
        }
      },
    })

    return () => sub.unsubscribe()
  }, [state])

  const children = useMemo(
    () =>
      state.isNotFound ? (
        <NotFound>
          {state.intent && (
            <div>
              No tool can handle the intent: <strong>{state.intent.name}</strong> with parameters{' '}
              <pre>{JSON.stringify(state.intent.params)}</pre>
            </div>
          )}
        </NotFound>
      ) : (
        <DefaultLayout tools={tools} />
      ),
    [state.isNotFound, state.intent, tools]
  )

  const handleNavigate = useCallback((url: string, options: any) => {
    urlStateStore.navigate(url, options)
  }, [])

  const routedChildren = state.urlState && (
    <RouterProvider router={rootRouter} state={state.urlState} onNavigate={handleNavigate}>
      {children}
    </RouterProvider>
  )

  if (routedChildren && LoginWrapper) {
    return (
      <LoginWrapper LoadingScreen={<AppLoadingScreen text="Logging in" />}>
        {routedChildren}
      </LoginWrapper>
    )
  }

  return routedChildren || <></>
}

export default DefaultLayoutRoot
