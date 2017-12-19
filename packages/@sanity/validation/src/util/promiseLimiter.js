const throat = require('throat')

const CONCURRENCY = 3

module.exports = {
  root: throat(CONCURRENCY),
  children: throat(CONCURRENCY)
}
