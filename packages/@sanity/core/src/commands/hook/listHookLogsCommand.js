import {inspect} from 'util'
import {groupBy} from 'lodash'
import {formatFailure} from './printHookAttemptCommand'

export default {
  name: 'logs',
  group: 'hook',
  signature: '[NAME]',
  description: 'List latest log entries for a given hook',
  action: async (args, context) => {
    const {apiClient} = context
    const flags = args.extOptions
    const [name] = args.argsWithoutOptions
    const client = apiClient()

    const hookId = await promptForHook(name, context)
    let messages
    let attempts
    try {
      messages = await client.request({uri: `/hooks/${hookId}/messages`})
      attempts = await client.request({uri: `/hooks/${hookId}/attempts`})
    } catch (err) {
      throw new Error(`Hook logs retrieval failed:\n${err.message}`)
    }

    const groupedAttempts = groupBy(attempts, 'messageId')
    const populated = messages.map((msg) => Object.assign(msg, {attempts: groupedAttempts[msg.id]}))
    const totalMessages = messages.length - 1

    populated.forEach((message, i) => {
      printMessage(message, context, {detailed: flags.detailed})
      printSeparator(context, totalMessages === i)
    })
  },
}

async function promptForHook(specified, context) {
  const specifiedName = specified && specified.toLowerCase()
  const {prompt, apiClient} = context
  const client = apiClient()

  const hooks = await client.request({uri: '/hooks', json: true})
  if (specifiedName) {
    const selected = hooks.filter((hook) => hook.name.toLowerCase() === specifiedName)[0]
    if (!selected) {
      throw new Error(`Hook with name "${specified} not found"`)
    }

    return selected.id
  }

  if (hooks.length === 0) {
    throw new Error('No hooks currently registered')
  }

  if (hooks.length === 1) {
    return hooks[0].id
  }

  const choices = hooks.map((hook) => ({value: hook.id, name: hook.name}))
  return prompt.single({
    message: 'Select hook to list logs for',
    type: 'list',
    choices,
  })
}

function printSeparator(context, skip) {
  if (!skip) {
    context.output.print('---\n')
  }
}

function printMessage(message, context, options) {
  const {detailed} = options
  const {output, chalk} = context

  output.print(`Date: ${message.createdAt}`)
  output.print(`Status: ${message.status}`)
  output.print(`Result code: ${message.resultCode}`)

  if (message.failureCount > 0) {
    output.print(`Failures: ${message.failureCount}`)
  }

  if (detailed) {
    output.print('Payload:')
    output.print(inspect(JSON.parse(message.payload), {colors: true}))
  }

  if (detailed && message.attempts) {
    output.print('Attempts:')
    message.attempts.forEach((attempt) => {
      const date = attempt.createdAt.replace(/\.\d+Z$/, 'Z')
      const prefix = `  [${date}]`

      if (attempt.inProgress) {
        output.print(`${prefix} ${chalk.yellow('Pending')}`)
      } else if (attempt.isFailure) {
        const failure = formatFailure(attempt, {includeHelp: true})
        output.print(`${prefix} ${chalk.yellow(`Failure: ${failure}`)}`)
      } else {
        output.print(`${prefix} Success: HTTP ${attempt.resultCode} (${attempt.duration}ms)`)
      }
    })
  }

  // Leave some empty space between messages
  output.print('')
}
