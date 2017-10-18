import generateHelpUrl from '@sanity/generate-help-url'

// eslint-disable-next-line no-console
console.warn('👋 Hi there. You are using the plugin @sanity/date-input.'
  + ' It has been renamed to @sanity/rich-date-input, so you should update your '
  + `sanity.json. For more info, please see ${generateHelpUrl('deprecated-sanity-date-input')}`)

export {default} from '@sanity/rich-date-input'
