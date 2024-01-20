import {type ConsentStatus} from '@sanity/telemetry'

import {
  telemetryLearnMoreMessage,
  telemetryStatusMessage,
} from '../../commands/telemetry/telemetryStatusCommand'
import {debug} from '../../debug'
import {type CliCommandAction} from '../../types'
import {
  type ConsentInformation,
  resolveConsent,
  TELEMETRY_CONSENT_CONFIG_KEY,
} from '../../util/createTelemetryStore'
import {getUserConfig} from '../../util/getUserConfig'

type SettableConsentStatus = Extract<ConsentStatus, 'granted' | 'denied'>

interface ResultMessage {
  success: () => string
  failure: (message?: string) => string
  unchanged: (consentInformation: ConsentInformation) => string
}

const resultMessages: Record<SettableConsentStatus, ResultMessage> = {
  granted: {
    success: () => `You've now enabled telemetry data collection to help us improve Sanity.`,
    unchanged: () => `You've already enabled telemetry data collection to help us improve Sanity.`,
    failure: (message) => {
      if (message) {
        return `Failed to enable telemetry: ${message}`
      }
      return 'Failed to enable telemetry'
    },
  },
  denied: {
    success: () =>
      `You've opted out of telemetry data collection.\nNo data will be collected from your Sanity account.`,
    unchanged: ({reason}) => {
      if (reason === 'localOverride') {
        return `You've already opted out of telemetry data collection.\nNo data is collected from your machine.\n\nUsing DO_NOT_TRACK environment variable.`
      }
      return `You've already opted out of telemetry data collection.\nNo data is collected from your Sanity account.`
    },
    failure: () => 'Failed to disable telemetry',
  },
}

export function createSetTelemetryConsentAction(status: SettableConsentStatus): CliCommandAction {
  return async function setTelemetryConsentAction(_, context) {
    const {apiClient, output} = context
    const config = getUserConfig()

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    }).withConfig({
      apiVersion: '2023-12-18',
      useProjectHostname: false,
    })
    // eslint-disable-next-line no-process-env
    const currentInformation = await resolveConsent({env: process.env})
    const isChanged = currentInformation.status !== status

    if (!isChanged) {
      debug('Telemetry consent is already "%s"', status)
      output.print(`${telemetryStatusMessage(status, context)}\n`)
      output.print(resultMessages[status].unchanged(currentInformation))
    }

    if (isChanged) {
      debug('Setting telemetry consent to "%s"', status)
      try {
        const uri = `/users/me/consents/telemetry/status/${status}`
        debug('Sending telemetry consent status to %s', uri)

        await client.request({
          method: 'PUT',
          uri,
        })

        // Clear cached telemetry consent
        config.delete(TELEMETRY_CONSENT_CONFIG_KEY)

        output.print(`${telemetryStatusMessage(status, context)}\n`)
        output.print(resultMessages[status].success())
      } catch (err) {
        const errorMessage = resultMessages[status].failure(err.response?.body?.message)
        if (err.statusCode === 403) {
          // throw without stack trace from original error
          throw new Error(errorMessage)
        } else {
          // if not 403, throw original error
          err.message = errorMessage
          throw err
        }
      }
    }

    output.print(`\n${telemetryLearnMoreMessage(status)}`)
  }
}
