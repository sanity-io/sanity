const url = require('url')
const logSymbols = require('log-symbols')
const oneline = require('oneline')

const wildcardReplacement = 'a-wild-card-r3pl4c3m3n7-a'
const portReplacement = ':7777777'

module.exports = async function addCorsOrigin(givenOrigin, flags, context) {
  const {apiClient, prompt, output} = context
  const origin = await (givenOrigin
    ? filterAndValidateOrigin(givenOrigin)
    : promptForOrigin(prompt))

  const hasWildcard = origin.includes('*')
  if (hasWildcard && !(await promptForWildcardConfirmation(origin, context))) {
    return false
  }
  const allowCredentials =
    typeof flags.credentials === 'undefined'
      ? await promptForCredentials(hasWildcard, context)
      : Boolean(flags.credentials)

  if (givenOrigin !== origin) {
    output.print(`Normalized origin to ${origin}`)
  }

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  })

  return client.request({
    method: 'POST',
    url: '/cors',
    body: {origin, allowCredentials},
    maxRedirects: 0,
  })
}

function promptForCredentials(hasWildcard, context) {
  const {prompt, output, chalk} = context

  output.print('')
  if (hasWildcard) {
    output.print(oneline`
      ${chalk.yellow(`${logSymbols.warning} Warning:`)}
      We ${chalk.red(chalk.underline('HIGHLY'))} recommend NOT allowing credentials
      on origins containing wildcards. If you are logged in to a studio, people will
      be able to send requests ${chalk.underline('on your behalf')} to read and modify
      data, from any matching origin. Please tread carefully!
    `)
  } else {
    output.print(oneline`
      ${chalk.yellow(`${logSymbols.warning} Warning:`)}
      Should this origin be allowed to send requests using authentication tokens or
      session cookies? Be aware that any script on this origin will be able to send
      requests ${chalk.underline('on your behalf')} to read and modify data if you
      are logged in to a Sanity studio. If this origin hosts a studio, you will need
      this, otherwise you should probably answer "No" (n).
    `)
  }

  output.print('')

  return prompt.single({
    type: 'confirm',
    message: oneline`
      Allow credentials to be sent from this origin? Please read the warning above.
    `,
    default: false,
  })
}

function promptForWildcardConfirmation(origin, context) {
  const {prompt, output, chalk} = context

  output.print('')
  output.print(chalk.yellow(`${logSymbols.warning} Warning: Examples of allowed origins:`))

  if (origin === '*') {
    output.print('- http://www.some-malicious.site')
    output.print('- https://not.what-you-were-expecting.com')
    output.print('- https://high-traffic-site.com')
    output.print('- http://192.168.1.1:8080')
  } else {
    output.print(`- ${origin.replace(/:\*/, ':1234').replace(/\*/g, 'foo')}`)
    output.print(`- ${origin.replace(/:\*/, ':3030').replace(/\*/g, 'foo.bar')}`)
  }

  output.print('')

  return prompt.single({
    type: 'confirm',
    message: oneline`
      Using wildcards can be ${chalk.red('risky')}.
      Are you ${chalk.underline('absolutely sure')} you want to allow this origin?`,
    default: false,
  })
}

function promptForOrigin(prompt) {
  return prompt.single({
    type: 'input',
    message: 'Origin (including protocol):',
    filter: filterOrigin,
    validate: validateOrigin,
  })
}

function filterOrigin(origin) {
  if (origin === '*' || origin === 'file:///*') {
    return origin
  }

  try {
    const example = origin
      .replace(/([^:])\*/g, `$1${wildcardReplacement}`)
      .replace(/:\*/, portReplacement)

    const parsed = url.parse(example)
    let host = parsed.host
    if (/^https?:$/.test(parsed.protocol || '')) {
      host = parsed.host.replace(/:(80|443)$/, '')
    }

    host = host.replace(portReplacement, ':*').replace(new RegExp(wildcardReplacement, 'g'), '*')

    return `${parsed.protocol}//${host}`
  } catch (err) {
    return null
  }
}

function validateOrigin(origin, givenOrigin) {
  if (origin === '*' || origin === 'file:///*') {
    return true
  }

  try {
    url.parse(origin || 0) // Use 0 to trigger error for unset values
    return true
  } catch (err) {
    // Fall-through to error
  }

  if (/^file:\/\//.test(givenOrigin)) {
    return `Only a local file wildcard is currently allowed: file:///*`
  }

  return `Invalid origin "${givenOrigin}", must include protocol (https://some.host)`
}

function filterAndValidateOrigin(givenOrigin) {
  const origin = filterOrigin(givenOrigin)
  const result = validateOrigin(origin, givenOrigin)
  if (result !== true) {
    throw new Error(result)
  }

  return origin
}
