#!/usr/bin/env node

/* eslint-disable no-process-exit, no-console */
const path = require('path')
const express = require('express')
const middleware = require('@kadira/storybook/dist/server/middleware')
const webpackConfig = require('../config/webpack.config')
const storybook = middleware.default || middleware

let app = null

process.on('message', msg => {
  switch (msg.event) {
    case 'start':
      return startServer(msg)

    default:
      return unhandledMessage(msg)
  }
})

function startServer(msg) {
  webpackConfig.setSanityContext(msg.config)

  app = express()
  app.use(express.static(msg.config.staticPath, {index: false}))
  app.use(storybook(path.join(__dirname, '..', 'config')))

  app.listen(9001, msg.config.httpHost, error => {
    if (error) {
      // @todo message back that we've exited
      throw error
    }

    process.send({event: 'listening', url: `http://${msg.config.httpHost}:9001/`})
  })
}

function unhandledMessage(msg) {
  console.error(`Unhandled message of type "${msg.event}"; %s`, JSON.stringify(msg, null, 2))
}
