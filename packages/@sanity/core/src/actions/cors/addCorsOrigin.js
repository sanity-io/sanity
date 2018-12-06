const url = require('url')
const logSymbols = require('log-symbols')
const oneline = require('oneline')

const wildcardReplacement = 'a-wild-card-r3pl4c3m3n7-a'
const portReplacement = ':7777777'

module.exports = async function addCorsOrigin(givenOrigin, context) {
  const {apiClient, prompt, output} = context
  const origin = await (givenOrigin
    ? filterAndValidateOrigin(givenOrigin)
    : promptForOrigin(prompt))

  if (givenOrigin !== origin) {
    output.print(`Normalized origin to ${origin}`)
  }

  if (origin.includes('*') && !(await promptForWildcardConfirmation(origin, context))) {
    return false
  }

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  return client.request({
    method: 'POST',
    url: '/cors',
    body: {origin},
    maxRedirects: 0
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
    default: false
  })
}

function promptForOrigin(prompt) {
  return prompt.single({
    type: 'input',
    message: 'Origin (including protocol):',
    filter: filterOrigin,
    validate: validateOrigin
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
    if (!/^https?:$/.test(parsed.protocol || '')) {
      return null
    }

    const host = parsed.host
      .replace(/:(80|443)$/, '')
      .replace(portReplacement, ':*')
      .replace(new RegExp(wildcardReplacement, 'g'), '*')

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
