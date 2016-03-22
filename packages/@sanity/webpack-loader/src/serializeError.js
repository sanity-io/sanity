'use strict'

const fs = require('fs')
const path = require('path')

let template = null

function getTemplate(callback) {
  if (template) {
    setImmediate(callback, null, template)
    return
  }

  fs.readFile(
    path.join(__dirname, 'renderError.js'),
    {encoding: 'utf8'},
    (readErr, content) => {
      template = content
      callback(readErr, content)
    }
  )
}

module.exports = function serializeError(srcErr, callback) {
  getTemplate((readErr, content) => {
    callback(readErr, content && content
      .replace(/'%ERR\.MESSAGE%'/g, JSON.stringify(srcErr.message.replace(/\n/g, '<br/>\n')))
      .replace(/'%ERR\.STACK%'/g, JSON.stringify(srcErr.stack))
    )
  })
}
