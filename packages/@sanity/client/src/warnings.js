const generateHelpUrl = require('@sanity/generate-help-url')
const once = require('./util/once')

const createWarningPrinter = (message) =>
  // eslint-disable-next-line no-console
  once((...args) => console.warn(message.join(' '), ...args))

exports.printCdnWarning = createWarningPrinter([
  'You are not using the Sanity CDN. That means your data is always fresh, but the CDN is faster and',
  `cheaper. Think about it! For more info, see ${generateHelpUrl('js-client-cdn-configuration')}.`,
  'To hide this warning, please set the `useCdn` option to either `true` or `false` when creating',
  'the client.',
])

exports.printBrowserTokenWarning = createWarningPrinter([
  'You have configured Sanity client to use a token in the browser. This may cause unintentional security issues.',
  `See ${generateHelpUrl(
    'js-client-browser-token'
  )} for more information and how to hide this warning.`,
])

exports.printCdnTokenWarning = createWarningPrinter([
  'You have set `useCdn` to `true` while also specifying a token. This is usually not what you',
  'want. The CDN cannot be used with an authorization token, since private data cannot be cached.',
  `See ${generateHelpUrl('js-client-usecdn-token')} for more information.`,
])

exports.printNoApiVersionSpecifiedWarning = createWarningPrinter([
  'Using the Sanity client without specifying an API version is deprecated.',
  `See ${generateHelpUrl('js-client-api-version')}`,
])
