import {createWriteStream} from 'node:fs'
import zlib from 'node:zlib'

import {type ProgressData} from 'archiver'

import debug from './debug'

const archiver = require('archiver')

// ProgressCb is a callback that is called with the number of bytes processed so far.
type ProgressCb = (processedBytes: number) => void

// archiveDir creates a tarball of the given directory and writes it to the given file path.
function archiveDir(tmpOutDir: string, outFilePath: string, progressCb: ProgressCb): Promise<void> {
  return new Promise((resolve, reject) => {
    const archiveDestination = createWriteStream(outFilePath)
    archiveDestination.on('error', (err: Error) => {
      reject(err)
    })

    archiveDestination.on('close', () => {
      resolve()
    })

    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: {level: zlib.constants.Z_DEFAULT_COMPRESSION},
    })

    archive.on('error', (err: Error) => {
      debug('Archiving errored!\n%s', err.stack)
      reject(err)
    })

    // Catch warnings for non-blocking errors (stat failures and others)
    archive.on('warning', (err: Error) => {
      debug('Archive warning: %s', err.message)
    })

    archive.on('progress', (progress: ProgressData) => {
      progressCb(progress.fs.processedBytes)
    })

    // Pipe archive data to the file
    archive.pipe(archiveDestination)
    archive.directory(tmpOutDir, false)
    archive.finalize()
  })
}

export default archiveDir
