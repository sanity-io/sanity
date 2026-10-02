import {Card, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type LoginComponentProps} from '../types'

/**
 * An error response from the authorization server (RFC 6749 section 4.1.2.1): the error code,
 * and its human-readable description when the server sent one.
 *
 * @internal
 */
export interface OAuthCallbackError {
  error: string
  description?: string
}

/** @internal */
export interface CreateOAuthLoginComponentOptions {
  /** Starts the authorization request. Navigates away on success. */
  login: (redirectPath: string) => Promise<void>
  /** The authorization server's refusal of this tab's last request, `undefined` when none. */
  callbackError$?: Observable<OAuthCallbackError | undefined>
}

/**
 * The login screen of an OAuth auth store: one button that sends the user to the authorization
 * server. There are no providers to choose from, because the authorization server handles the
 * provider choice itself.
 *
 * @internal
 */
export function createOAuthLoginComponent({
  login,
  callbackError$,
}: CreateOAuthLoginComponentOptions) {
  function OAuthLoginComponent(props: LoginComponentProps) {
    const {t} = useTranslation()
    const callbackError = useObservable(callbackError$ ?? NO_ERROR, undefined)
    // oxlint-disable-next-line no-deprecated -- same fallback as the provider login component
    const redirectPath = props.redirectPath || props.basePath || '/'
    const [isRedirecting, setIsRedirecting] = useState(false)

    const [error, setError] = useState<unknown>(null)
    if (error) throw error

    // Leaving for the authorization server is a full navigation, but the browser may keep this
    // page in its back/forward cache. If the authorization page fails and the user presses Back,
    // the page is restored as it was, with the button still busy and nothing in flight. The
    // restore fires `pageshow` with `persisted`, so that is when the button is released.
    useEffect(() => {
      const handlePageShow = (event: PageTransitionEvent) => {
        if (event.persisted) setIsRedirecting(false)
      }
      window.addEventListener('pageshow', handlePageShow)
      return () => window.removeEventListener('pageshow', handlePageShow)
    }, [])

    const handleSignIn = useCallback(() => {
      setIsRedirecting(true)
      login(redirectPath).catch((err: unknown) => {
        setIsRedirecting(false)
        setError(err)
      })
    }, [redirectPath])

    return (
      <Stack gap={4}>
        <Heading align="center" size={1}>
          {t('login.oauth.title')}
        </Heading>
        {callbackError && (
          <Card data-testid="oauth-login-error" padding={3} radius={2} tone="critical">
            <Stack gap={2}>
              <Text size={1} weight="medium">
                {t('login.oauth.authorization-failed')}
              </Text>
              <Text size={1}>{callbackError.description ?? callbackError.error}</Text>
              {callbackError.description && (
                <Text muted size={0}>
                  {callbackError.error}
                </Text>
              )}
            </Stack>
          </Card>
        )}
        <Button
          autoFocus
          // Disabled as well as loading: a second click would start a second authorization
          // request and overwrite the stored verifier of the first.
          disabled={isRedirecting}
          loading={isRedirecting}
          onClick={handleSignIn}
          size="large"
          text={t('login.oauth.sign-in')}
          tone="primary"
          width="fill"
        />
      </Stack>
    )
  }

  return OAuthLoginComponent
}

const NO_ERROR: Observable<OAuthCallbackError | undefined> = of(undefined)
