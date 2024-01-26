import {tmpdir} from 'node:os'
import path from 'node:path'

export function getBufferFilePath() {
  return path.join(tmpdir(), `/export-buffer-${Date.now()}.tmp`)
}
