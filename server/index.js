const path = require('path')
const express = require('express')
const middleware = require('@kadira/storybook/dist/server/middleware').default

module.exports = config => {
  const app = express()
  const host = config.host || 'localhost'
  const port = config.port || 9001

  if (config.staticPath) {
    app.use(express.static(config.staticPath, {index: false}))
  }

  const configDir = path.join(__dirname, 'storyConfig')
  app.use(middleware(configDir))

  return new Promise(
    (resolve, reject) => app.listen(port, host, err => {
      if (err) {
        reject(err)
      } else {
        resolve(`http://${host}:${port}/`)
      }
    }
  ))
}
