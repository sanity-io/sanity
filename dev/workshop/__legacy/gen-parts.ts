import fs from 'fs'
import path from 'path'
import {promisify} from 'util'
import {createPartsResolver} from './partsResolver'

const writeFile = promisify(fs.writeFile)

async function genParts() {
  const partsResolver = createPartsResolver()
  const parts = await partsResolver.load()

  await writeFile(
    path.resolve(__dirname, './parts.js'),
    `export default ${JSON.stringify(parts)}\n`
  )
}

genParts().catch((err) => {
  console.error(err)

  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
