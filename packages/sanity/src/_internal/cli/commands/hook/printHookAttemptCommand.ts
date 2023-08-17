import type {CliCommandDefinition} from '@sanity/cli'
import type {DeliveryAttempt} from './types'

const printHookAttemptCommand: CliCommandDefinition = {
  name: 'attempt',
  group: 'hook',
  signature: 'ATTEMPT_ID',
  helpText: '',
  description: 'Print details of a given webhook delivery attempt',
  action: async (args, context) => {
    const {apiClient, output} = context
    const [attemptId] = args.argsWithoutOptions
    const client = apiClient()

    let attempt
    try {
      attempt = await client.request<DeliveryAttempt>({uri: `/hooks/attempts/${attemptId}`})
    } catch (err) {
      throw new Error(`Hook attempt retrieval failed:\n${err.message}`)
    }

    const {createdAt, resultCode, resultBody, failureReason, inProgress} = attempt

    output.print(`Date: ${createdAt}`)
    output.print(`Status: ${getStatus(attempt)}`)
    output.print(`Status code: ${resultCode}`)

    if (attempt.isFailure) {
      output.print(`Failure: ${formatFailure(attempt)}`)
    }

    if (!inProgress && (!failureReason || failureReason === 'http')) {
      const body = resultBody ? `\n---\n${resultBody}\n---\n` : '<empty>'
      output.print(`Response body: ${body}`)
    }
  },
}

export default printHookAttemptCommand

export function formatFailure(
  attempt: DeliveryAttempt,
  options: {includeHelp?: boolean} = {},
): string {
  const {includeHelp} = options
  const {id, failureReason, resultCode} = attempt
  const help = includeHelp ? `(run \`sanity hook attempt ${id}\` for details)` : ''
  switch (failureReason) {
    case 'http':
      return `HTTP ${resultCode} ${help}`
    case 'timeout':
      return 'Request timed out'
    case 'network':
      return 'Network error'
    case 'other':
    default:
  }

  return 'Unknown error'
}

export function getStatus(attempt: DeliveryAttempt): string {
  if (attempt.isFailure) {
    return 'Failed'
  }

  if (attempt.inProgress) {
    return 'In progress'
  }

  return 'Delivered'
}
