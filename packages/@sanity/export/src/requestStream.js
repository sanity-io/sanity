const simpleGet = require('simple-get')

module.exports = options =>
  new Promise((resolve, reject) => {
    simpleGet(options, (err, res) => (err ? reject(err) : resolve(res)))
  })
