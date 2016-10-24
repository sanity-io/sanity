/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import boxen from 'boxen'
import chalk from 'chalk'
import gzipSize from 'gzip-size'
import prettyBytes from 'pretty-bytes'

const umdPath = path.join(__dirname, '..', '..', 'umd')
const bundlePath = path.join(umdPath, 'sanityClient.js')
const minPath = path.join(umdPath, 'sanityClient.min.js')

fs.readFile(bundlePath, (bundleErr, bundle) => {
  throwOnError(bundleErr)

  fs.readFile(minPath, (minErr, minBundle) => {
    throwOnError(minErr)

    gzipSize(bundle, (gzipErr, gzipedSize) => {
      throwOnError(gzipErr)

      const output = [
        'UMD bundle size:',
        '────────────────',
        `Minified: ${size(bundle.length)}`,
        `Minified + gzip: ${size(gzipedSize)}`
      ].join('\n')

      console.log(boxen(output, {
        padding: 1,
        borderColor: 'yellow',
        align: 'right'
      }))
    })
  })
})

function throwOnError(err) {
  if (err && err.code === 'ENOENT') {
    throw new Error('File not found, did you run `npm run build` first?')
  } else if (err) {
    throw err
  }
}

function size(bytes) {
  const color = bytes > 1024 * 50 ? 'red' : 'green'
  return chalk[color](prettyBytes(bytes))
}
