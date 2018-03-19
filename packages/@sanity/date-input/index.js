// NO ES6
const generateHelpUrl = require('@sanity/generate-help-url')

// eslint-disable-next-line no-console, prefer-template
console.warn(
  `${'👋 Hi there! You are using the plugin @sanity/date-input.' +
    ' It has been renamed to @sanity/rich-date-input. You should update your studio to use the rich-date plugin.' +
    ' For more info, see '}${generateHelpUrl('deprecated-sanity-date-input')}`
)

module.exports = require('@sanity/rich-date-input')
