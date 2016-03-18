/* eslint-env node */
const fs = require('fs')
const path = require('path')
const qs = require('querystring')

module.exports = function sanityStyleLoader(input) {
  const query = qs.parse(this.query.substring(1))
  const filePath = path.join(__dirname, 'components', `${query.style}.css`)

  let css = `/**\n * Role: ${query.style}\n */\n\n`
  css += `/* ${filePath} */\n`
  css += fs.readFileSync(filePath)

  return css
}
