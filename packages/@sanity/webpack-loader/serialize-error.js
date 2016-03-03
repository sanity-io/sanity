const fs = require('fs')
const path = require('path')

module.exports = function serializeError(srcErr) {
  const content = fs.readFileSync(
    path.join(__dirname, 'render-error.js'),
    {encoding: 'utf8'}
  )

  return content
    .replace(/'%ERR\.MESSAGE%'/g, JSON.stringify(srcErr.message.replace(/\n/g, '<br/>\n')))
    .replace(/'%ERR\.STACK%'/g, JSON.stringify(srcErr.stack))
}
