const {readFile} = require('fs/promises')

module.exports = async function readJson(filePath) {
  const file = await readFile(filePath, 'utf8')
  return JSON.parse(file)
}
