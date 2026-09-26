import {Heading, Stack} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type LoginComponentProps} from './types'

/** @internal */
export interface CreateOAuthLoginComponentOptions {
  /** Starts the authorization request. Navigates away on success. */
  login: (redirectPath: string) => Promise<void>
}

/**
 * The login screen of an OAuth auth store: one button that sends the user to the authorization
 * server. There are no providers to choose from, because the authorization server handles the
 * provider choice itself.
 *
 * @internal
 */
export function createOAuthLoginComponent({login}: CreateOAuthLoginComponentOptions) {
  function OAuthLoginComponent(props: LoginComponentProps) {
    const {t} = useTranslation()
    // oxlint-disable-next-line no-deprecated -- same fallback as the provider login component
    const redirectPath = props.redirectPath || props.basePath || '/'
    const [isRedirecting, setIsRedirecting] = useState(false)

    const [error, setError] = useState<unknown>(null)
    if (error) throw error

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
