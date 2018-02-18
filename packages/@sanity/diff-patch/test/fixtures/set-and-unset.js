const nested = require('./nested')

exports.a = Object.assign({}, nested.a, {
  year: 1995,
  slug: Object.assign({auto: true}, nested.a.slug)
})

exports.b = Object.assign({}, nested.b)
