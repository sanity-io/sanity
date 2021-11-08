// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Card, Code, Stack, Text} from '@sanity/ui'
import {isEqual} from 'lodash'
import React, {useCallback, useEffect, useState} from 'react'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from '@sanity/base/router'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import * as urlStateStore from './datastores/urlState'
import rootRouter, {maybeRedirectToBase} from './router'
import {DefaultLayout} from './defaultLayout'
import {NotFound} from './main'
import {ErrorScreen} from './ErrorScreen'

const NormalizedLoginWrapper = (props: {children: React.ReactNode}) => {
  if (!LoginWrapper) return props.children as JSX.Element
  return <LoginWrapper LoadingScreen={<AppLoadingScreen text="Logging in" />} {...props} />
}

interface State {
  intent?: {
    name: string
    params: {[key: string]: string}
  }
  urlState?: Record<string, unknown>
  isNotFound: boolean
}

function DefaultLayoutRoot() {
  const [state, setState] = useState<State>({isNotFound: false})
  const [error, setError] = useState<Error | null>(null)

  useEffect(maybeRedirectToBase, [])

  useEffect(() => {
    const sub = urlStateStore.state.subscribe((event) => {
      if (event.type === 'error') {
        setError(event.error)
        return
      }

      setState((prev) => {
        const next = {
          urlState: event.state || prev.urlState,
          isNotFound: event.isNotFound || prev.isNotFound,
          intent: event.type === 'snapshot' ? event.intent || prev.intent : prev.intent,
        }

        // If you update a State Hook to the same value as the current state,
        // React will bail out without rendering the children or firing effects.
        // https://reactjs.org/docs/hooks-reference.html#bailing-out-of-a-state-update
        if (isEqual(next, prev)) return prev

        return next
      })
    })

    return () => sub.unsubscribe()
  }, [])

  const handleNavigate = useCallback((url: string, options: any) => {
    urlStateStore.navigate(url, options)
  }, [])

  if (error) {
    return (
      <ErrorScreen
        description={<>Caught an unexpected error while routing:</>}
        error={error}
        title="Router error"
      />
    )
  }

  return (
    <NormalizedLoginWrapper>
      {state.urlState && (
        <RouterProvider router={rootRouter} state={state.urlState} onNavigate={handleNavigate}>
          {state.isNotFound && (
            <NotFound>
              {!state.intent && (
                <Stack space={4}>
                  <Text as="p" muted>
                    Could not find a tool that is configured to handle the{' '}
                    <code>{state.intent?.name || 'test'}</code> intent with parameters:
                  </Text>
                  <Card overflow="auto" padding={3} radius={2} tone="transparent">
                    <Code language="json">{JSON.stringify(state.intent?.params || {})}</Code>
                  </Card>
                </Stack>
              )}
            </NotFound>
          )}

          {!state.isNotFound && <DefaultLayout />}
        </RouterProvider>
      )}
    </NormalizedLoginWrapper>
  )
}

export default DefaultLayoutRoot
