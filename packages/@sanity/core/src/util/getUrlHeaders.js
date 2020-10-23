const simpleGet = require('simple-get')
const pkg = require('../../package.json')

module.exports = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    simpleGet(
      {
        url,
        method: 'HEAD',
        followRedirects: false,
        headers: {
          'User-Agent': `${pkg.name} ${pkg.version}`,
          ...headers,
        },
      },
      (err, res) => {
        if (err) {
          reject(err)
          return
        }

        if (res.statusCode >= 400) {
          const error = new Error(`Request returned HTTP ${res.statusCode}`)
          error.statusCode = res.statusCode
          reject(error)
          return
        }

        res.resume()
        resolve(res.headers)
      }
    )
  })
