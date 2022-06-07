const {promisify} = require('util')
const rimrafCb = require('rimraf')

module.exports = promisify(rimrafCb)
