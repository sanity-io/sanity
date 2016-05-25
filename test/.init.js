
// Needed because we import/require ProseMirror, which refers to `window` at source compile time
global.window = {}
// Needed because somewhere there's an import/require to fbjs/lib/getDocumentScrollElement.js,
// which refers to `navigator` at source compile time
global.navigator = {userAgent: 'Node.js'}

require('babel-register')
require('babel-polyfill')
