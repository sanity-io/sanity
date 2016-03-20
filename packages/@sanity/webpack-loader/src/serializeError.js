import fs from 'fs'
import path from 'path'

export default function serializeError(srcErr) {
  const content = fs.readFileSync(
    path.join(__dirname, 'renderError.js'),
    {encoding: 'utf8'}
  )

  return content
    .replace(/'%ERR\.MESSAGE%'/g, JSON.stringify(srcErr.message.replace(/\n/g, '<br/>\n')))
    .replace(/'%ERR\.STACK%'/g, JSON.stringify(srcErr.stack))
}
