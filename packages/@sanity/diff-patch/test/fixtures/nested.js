const simple = require('./simple')

exports.a = Object.assign({slug: {current: 'die-hard-iii'}}, simple.a)
exports.b = Object.assign({}, exports.a, {slug: {current: 'die-hard-with-a-vengeance'}})
