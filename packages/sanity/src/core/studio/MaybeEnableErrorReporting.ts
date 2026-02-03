import {useEffect} from 'react'

import {type ErrorReporter} from '../error/errorReporter'
import {useClient} from '../hooks'

const CONSENT_CLIENT_OPTIONS = {apiVersion: '2023-12-18'}

/**
 * React component that checks for the users' telemetry consent, enabling or disabling error reporting
 * on the passed error reporter accordingly. Reporter should default to being disabled/buffer
 * events until the consent status is checked.
 *
 * Needs to be mounted within a SourceProvider to work correctly.
 *
 * @param props - Takes an error reporting instance to enable or disable based on the users' consent
 * @returns Explicitly return null. Component only has side effects.
 */
export function MaybeEnableErrorReporting(props: {errorReporter: ErrorReporter}): null {
  const {errorReporter} = props
  const client = useClient(CONSENT_CLIENT_OPTIONS)

  useEffect(() => {
    const request = client.observable
      .request({uri: '/intake/telemetry-status', tag: 'telemetry-consent.error-reporting'})
      .subscribe({
        next: (res) => {
          if (res?.status === 'granted') {
            errorReporter.enable()
          } else {
            errorReporter.disable()
          }
        },
        error: (err) => {
          console.error('Error fetching telemetry status', err)
        },
      })

    return () => request.unsubscribe()
  }, [client, errorReporter])

  return null
}
