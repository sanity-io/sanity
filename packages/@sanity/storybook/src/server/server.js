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

  const config = tryLoadConfig(msg.config.basePath)
  const enabled = config.enabled !== false
  const port = config.port || 9001

  if (!enabled) {
    return
  }

  app = express()
  app.use(express.static(msg.config.staticPath, {index: false}))
  app.use(storybook(path.join(__dirname, '..', 'config')))

  app.listen(port, msg.config.httpHost, error => {
    if (error) {
      // @todo message back that we've exited
      throw error
    }

    process.send({event: 'listening', url: `http://${msg.config.httpHost}:${port}/`})
  })
}

function unhandledMessage(msg) {
  console.error(`Unhandled message of type "${msg.event}"; %s`, JSON.stringify(msg, null, 2))
}

function tryLoadConfig(basePath) {
  try {
    return require(path.join(basePath, 'config', '@sanity', 'storybook.json'))
  } catch (err) {
    return {}
  }
}
