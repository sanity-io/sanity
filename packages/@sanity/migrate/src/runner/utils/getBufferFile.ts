import {tmpdir} from 'node:os'
import path from 'node:path'
import {mkdir} from 'node:fs/promises'

export async function createBufferFile() {
  const bufferDir = path.join(
    tmpdir(),
    'sanity-migrate',
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  await mkdir(bufferDir, {recursive: true})
  return path.join(bufferDir, `snapshot.ndjson`)
}
