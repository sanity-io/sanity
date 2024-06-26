import {type SanityClient} from '@sanity/client'
import {useEffect} from 'react'

import {errorReporter} from '../error/errorReporter'
import {useClient} from '../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'

async function fetchTelemetryConsent(client: SanityClient) {
  return client.request({uri: '/intake/telemetry-status'})
}

export function EnableErrorReporting() {
  const client = useClient().withConfig(DEFAULT_STUDIO_CLIENT_OPTIONS)

  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetchTelemetryConsent(client)

        if (res?.status === 'granted') {
          errorReporter.enable()
        } else {
          errorReporter.disable()
        }
      } catch (e) {
        console.error('Error fetching telemetry status', e)
      }
    }

    checkConsent()
  }, [client])

  return null
}
