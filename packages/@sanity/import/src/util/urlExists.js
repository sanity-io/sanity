const https = require('https')
const parseUrl = require('url').parse

const MAX_RETRIES = 5

function getStatusCodeForUrl(url) {
  const options = {...parseUrl(url), method: 'HEAD'}
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.resume()
      resolve(res.statusCode)
    })
    req.on('error', reject)
    req.end()
  })
}

async function urlExists(url) {
  let error
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const statusCode = await getStatusCodeForUrl(url)
      return statusCode === 200
    } catch (err) {
      error = err

      // Wait one second before retrying the request
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  throw error
}

module.exports = urlExists
