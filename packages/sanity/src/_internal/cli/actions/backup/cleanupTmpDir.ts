import rimraf from 'rimraf'

import debug from './debug'

function cleanupTmpDir(tmpDir: string): void {
  rimraf(tmpDir, (err) => {
    if (err) {
      debug(`Error cleaning up temporary files: ${err.message}`)
    }
  })
}

export default cleanupTmpDir
