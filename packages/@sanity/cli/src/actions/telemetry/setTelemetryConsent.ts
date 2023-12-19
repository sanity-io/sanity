import {type ConsentStatus} from '@sanity/telemetry'
import {ClientError, ServerError} from '@sanity/client'
import {type CliCommandAction} from '../../types'
import {debug} from '../../debug'
import {getUserConfig} from '../../util/getUserConfig'
import {
  ConsentInformation,
  TELEMETRY_CONSENT_CONFIG_KEY,
  resolveConsent,
} from '../../util/createTelemetryStore'
import {
  telemetryLearnMoreMessage,
  telemetryStatusMessage,
} from '../../commands/telemetry/telemetryStatusCommand'

type SettableConsentStatus = Extract<ConsentStatus, 'granted' | 'denied'>

const MOCK_MODES = ['success', 'failure:server', 'failure:msa'] as const
type MockMode = (typeof MOCK_MODES)[number]

interface SetConsentResponse<Type = string> {
  type: Type
  status: ConsentStatus
  updatedAt: string
}

type Mock = () => Promise<SetConsentResponse<'telemetry'>>

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

const mocks: Record<MockMode, Mock> = {
  success: () =>
    Promise.resolve({
      type: 'telemetry',
      status: 'granted',
      updatedAt: '2023-08-08T13:40:30.801847Z',
    }),
  'failure:server': () => {
    throw new ServerError({
      statusCode: 500,
      headers: {},
      body: {},
    })
  },
  'failure:msa': () => {
    throw new ClientError({
      statusCode: 403,
      headers: {},
      body: {
        message: 'User cannot give consent',
      },
    })
  },
}

function isMockMode(mode?: string): mode is MockMode {
  return MOCK_MODES.includes(mode as MockMode)
}

function validateMockMode() {
  // eslint-disable-next-line no-process-env
  if (process.env.MOCK_TELEMETRY_CONSENT_MODE) {
    // eslint-disable-next-line no-process-env
    const mode = process.env.MOCK_TELEMETRY_CONSENT_MODE.toLowerCase()

    if (!isMockMode(mode)) {
      const validModes = new Intl.ListFormat('en-US', {
        style: 'long',
        type: 'disjunction',
      }).format(MOCK_MODES.map((name) => `"${name}"`))

      throw new Error(
        `Invalid value provided for environment variable MOCK_TELEMETRY_CONSENT_MODE. Must be either ${validModes}`,
      )
    }
  }
}

// eslint-disable-next-line consistent-return
function getMock(): Mock | undefined {
  validateMockMode()

  // eslint-disable-next-line no-process-env
  const mode = process.env.MOCK_TELEMETRY_CONSENT_MODE?.toLowerCase()

  if (isMockMode(mode)) {
    return mocks[mode]
  }
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

    const mock = getMock()

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
        if (mock) {
          debug('Mocking telemetry consent request')
          await mock()
        } else {
          // TODO: Finalise API request.
          const uri = `/users/me/consents/telemetry/status/${status}`
          debug('Sending telemetry consent status to %s', uri)

          await client.request({
            method: 'PUT',
            uri,
          })
        }

        // Clear cached telemetry consent
        config.delete(TELEMETRY_CONSENT_CONFIG_KEY)

        output.print(`${telemetryStatusMessage(status, context)}\n`)
        output.print(resultMessages[status].success())
      } catch (err) {
        err.message = resultMessages[status].failure(err?.responseBody?.message)
        throw err
      }
    }

    output.print(`\n${telemetryLearnMoreMessage(status)}`)
  }
}
