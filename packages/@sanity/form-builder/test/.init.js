
// Needed because we import/require ProseMirror, which refers to `window` at source compile time
const jsdom = require("jsdom").jsdom

function setupJSDom() {
  if (typeof global.document !== 'undefined') return

  global.document = jsdom('<html><body></body></html>')
  global.window = global.document.defaultView
  global.navigator = {
    userAgent: 'Node.js'
  }
}
// Needed because somewhere there's an import/require to fbjs/lib/getDocumentScrollElement.js,
// which refers to `navigator` at source compile time
setupJSDom()

const registerLoader = require('@sanity/plugin-loader')
registerLoader({basePath: __dirname})

require('babel-register')
require('babel-polyfill')
