import debug from './debug'
import {rimraf} from 'rimraf'

async function cleanupTmpDir(tmpDir: string): Promise<void> {
  try {
    await rimraf(tmpDir)
  } catch (err) {
    debug(`Error cleaning up temporary files: ${err.message}`)
  }
}

export default cleanupTmpDir
