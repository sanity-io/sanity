import {tmpdir} from 'node:os'
import path from 'node:path'
import mkdirp from 'mkdirp'

export async function createBufferFile() {
  const bufferDir = path.join(
    tmpdir(),
    'sanity-migrate',
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  await mkdirp(bufferDir)
  return path.join(bufferDir, `snapshot.ndjson`)
}
