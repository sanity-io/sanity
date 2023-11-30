import {type ConsentStatus} from '@sanity/telemetry'
import {ClientError, ServerError} from '@sanity/client'
import {type CliCommandAction} from '../../types'

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
}

const resultMessages: Record<SettableConsentStatus, ResultMessage> = {
  granted: {
    success: () => 'Telemetry enabled',
    failure: (message) => {
      if (message) {
        return `Failed to enable telemetry: ${message}`
      }
      return 'Failed to enable telemetry'
    },
  },
  denied: {
    success: () => 'Telemetry disabled',
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
  return async function setTelemetryConsentAction(_, {apiClient, output, chalk}) {
    const client = apiClient({
      requireUser: true,
      requireProject: false,
    }).withConfig({
      // todo: change vX to stable
      apiVersion: 'vX',
      useProjectHostname: false,
    })

    const mock = getMock()

    try {
      if (mock) {
        await mock()
      } else {
        // TODO: Finalise API request.
        await client.request({
          method: 'PUT',
          uri: `/users/me/consents/telemetry/status/${status}`,
        })
      }

      output.print(chalk.green(resultMessages[status].success()))
    } catch (err) {
      err.message = resultMessages[status].failure(err?.responseBody?.message)
      throw err
    }
  }
}
