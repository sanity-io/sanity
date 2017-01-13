import fsp from 'fs-promise'
import {spawn} from 'child_process'
import concat from 'simple-concat'

export default inputFile => {
  const uglifyPath = require.resolve('uglify-js/bin/uglifyjs')
  const sourceFile = `${inputFile}.source`

  return new Promise(async (resolve, reject) => {
    await fsp.rename(inputFile, sourceFile)

    const uglify = spawn(uglifyPath, ['-c', '-m', '--', sourceFile])
    uglify.stdout.pipe(fsp.createWriteStream(inputFile))

    let error = ''
    concat(uglify.stderr, (err, buf) => {
      if (err) {
        reject(err)
      } else {
        error = buf.toString()
      }
    })

    uglify.on('close', async code => {
      if (code > 0) {
        return reject(new Error(error))
      }

      await fsp.unlink(sourceFile)
      return resolve()
    })
  })
}
