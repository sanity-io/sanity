// NO ES6
var generateHelpUrl = require('@sanity/generate-help-url')

// eslint-disable-next-line no-console, prefer-template
console.warn('👋 Hi there! You are using the plugin sanity-plugin-vision.'
  + ' It has been renamed to @sanity/vision. You should update your studio to use this instead.'
  + ' For more info, see ' + generateHelpUrl('renamed-plugin-vision'))

module.exports = require('@sanity/vision/tool')
