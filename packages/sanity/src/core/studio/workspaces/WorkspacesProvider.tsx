/* eslint-disable max-nested-callbacks */
import {ClientError, type RequestHandler, type SanityClient, ServerError} from '@sanity/client'
import {Stack, Text} from '@sanity/ui'
import isNativeNetworkError from 'is-network-error'
import QuickLRU from 'quick-lru'
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react'
import {defer, from, type Observable, Subject} from 'rxjs'
import {catchError, mergeMap, take, tap} from 'rxjs/operators'
import {WorkspacesContext} from 'sanity/_singletons'

import {Dialog} from '../../../ui-components'
import {type Config, prepareConfig} from '../../config'
import {type WorkspacesContextValue} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
  LoadingComponent: ComponentType
}

function isNetworkError(error: unknown): error is Error {
  return (
    (typeof error === 'object' &&
      error !== null &&
      // get-it sets isNetworkError=true
      // https://github.com/sanity-io/get-it/blob/9ffc7e0c2d41ffcfd3a33e7525d9d1f6b188f812/src/request/browser-request.ts#L194
      'isNetworkError' in error &&
      error.isNetworkError === true) ||
    isNativeNetworkError(error)
  )
}

const corsCheck = new QuickLRU<string, Promise<boolean>>({maxAge: 1000 * 60 * 2, maxSize: 200})

function checkCors(_client: SanityClient) {
  const projectId = _client.config().projectId
  if (!projectId) {
    return Promise.resolve(true)
  }
  const cached = corsCheck.get(projectId)
  if (cached) {
    return cached
  }
  // this is just a probe, so don't retry
  const client = _client.withConfig({maxRetries: 1})
  // todo: should be replaced with a cors-check endpoint
  const check = Promise.allSettled([
    client.request({
      url: '/ping',
      withCredentials: false,
      tag: 'cors-check',
    }),
    client.request({url: '/users/me', tag: 'cors-check', withCredentials: false}),
  ]).then(
    ([ping, user]) =>
      // ping request succeeded, but user request was network error so likely the CORS origin is disallowed
      ping.status === 'fulfilled' && user.status === 'rejected' && isNetworkError(user),
  )
  corsCheck.set(projectId, check)
  return check
}

type HandledError =
  | {type: 'cors'; isStaging: boolean; projectId?: string}
  | {type: 'networkError'; error: Error}
  | {type: 'serverError'; error: Error}
  | {type: 'clientError'; error: Error}

/** @internal */
export function WorkspacesProvider({
  config,
  children,
  basePath,
  LoadingComponent,
}: WorkspacesProviderProps) {
  const [error, setError] = useState<HandledError>()

  const [retry, onRetry] = useObservableEventHandler()

  const requestHandler: RequestHandler = useCallback(
    (requestOptions, originalRequest, client) => {
      return defer(() => originalRequest(requestOptions)).pipe(
        catchError((requestError: unknown, caught) => {
          // oxlint-disable-next-line no-console

          // Request failed for a non-auth reason, see if this was a CORS-error by
          // checking the `/ping` endpoint, which allows all origins
          return from(checkCors(client)).pipe(
            mergeMap((invalidCorsConfig) => {
              if (invalidCorsConfig) {
                // Throw a specific error on CORS-errors, to allow us to show a customized dialog
                setError({
                  type: 'cors',
                  isStaging: client.config().apiHost.endsWith('.work'),
                  projectId: client.config()?.projectId,
                })
                return retry.pipe(
                  take(1),
                  mergeMap(() =>
                    caught.pipe(
                      tap(() => {
                        setError(undefined)
                      }),
                    ),
                  ),
                )
              }

              if (requestError instanceof ClientError) {
                setError({type: 'clientError', error: requestError})
                return retry.pipe(
                  take(1),
                  mergeMap(() =>
                    caught.pipe(
                      tap(() => {
                        setError(undefined)
                      }),
                    ),
                  ),
                )
              }

              if (requestError instanceof ServerError) {
                setError({type: 'serverError', error: requestError})
                return retry.pipe(
                  take(1),
                  mergeMap(() =>
                    caught.pipe(
                      tap(() => {
                        setError(undefined)
                      }),
                    ),
                  ),
                )
              }

              // Some non-CORS error - is it one of those undefinable network errors?
              if (isNetworkError(requestError)) {
                setError({type: 'networkError', error: requestError})
                return retry.pipe(
                  take(1),
                  mergeMap(() =>
                    caught.pipe(
                      tap(() => {
                        setError(undefined)
                      }),
                    ),
                  ),
                )
              }
              // Some other error, just throw it, but make sure it gets caught by react
              setError(() => {
                throw requestError
              })
              return retry.pipe(
                take(1),
                mergeMap(() => caught),
              )
            }),
          )
        }),
      )
    },
    [retry],
  )

  const workspaces = useDeferredValue(
    prepareConfig(config, {basePath, requestHandler}).workspaces satisfies WorkspacesContextValue,
    null,
  )

  if (workspaces === null) {
    return <LoadingComponent />
  }

  return (
    <WorkspacesContext.Provider value={workspaces}>
      {error && <RequestErrorDialog error={error} onRetry={onRetry} />}
      {children}
    </WorkspacesContext.Provider>
  )
}

export function RequestErrorDialog(props: {error: HandledError; onRetry: () => void}) {
  const {error, onRetry} = props
  const heading =
    error.type === 'serverError'
      ? 'Server error'
      : error.type === 'networkError'
        ? 'Network error'
        : error.type === 'clientError'
          ? 'Request error'
          : 'Unknown error'

  const message =
    error.type === 'serverError'
      ? "The server ran into an issue and couldn't complete the request. Try again, or reload the page."
      : error.type === 'networkError'
        ? "Couldn't connect to the Sanity Servers. Please check your network connection and try again."
        : error.type === 'clientError'
          ? "The studio made a request the server couldn't process. Reload the page to try again. If the problem persists, contact your administrator."
          : 'An unknown request error occurred.'

  return (
    <Dialog
      id="not-authorized-dialog"
      header={heading}
      width={1}
      footer={
        onRetry
          ? {
              confirmButton: {
                text: 'Try again',
                onClick: onRetry,
                tone: 'default',
              },
            }
          : undefined
      }
    >
      <Stack space={4}>
        <Text>{message}</Text>
        {error.type === 'serverError' ? (
          <a href="https://status.sanity.io">{'Sanity Status'}</a>
        ) : null}
      </Stack>
    </Dialog>
  )
}

function useObservableEventHandler<T = void>(): [Observable<T>, (event: T) => void] {
  const [subject] = useState(() => new Subject<T>())
  const callback = useCallback(
    (value: T) => {
      subject.next(value)
    },
    [subject],
  )

  const observable = useMemo(() => {
    return subject.asObservable()
  }, [subject])

  return [observable, callback]
}
