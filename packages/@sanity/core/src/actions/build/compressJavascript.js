import fse from 'fs-extra'
import Terser, {minify as minifyJs} from 'terser'

export default async inputFile => {
  const content = await fse.readFile(inputFile, 'utf8')
  const minified = await minify(content, inputFile)
  await fse.outputFile(inputFile, minified)
}

function minify(content, fileName) {
  return new Promise((resolve, reject) => {
    // Terser introduced a breaking API change in a patch version
    // In case they revert or people are using an older version,
    // try both combinations
    let result
    if (minifyJs) {
      result = minifyJs(content)
    } else if (Terser.minify) {
      result = Terser.minify(content)
    } else {
      return reject(new Error('Breaking change in Terser - `minify` function not found'))
    }

    if (result.error) {
      reject(formatError(result.error, fileName, content))
    } else {
      resolve(result.code)
    }
  })
}

function formatError(err, fileName, content) {
  let msg = `Parse error at ${fileName}:${err.line},${err.col}`

  const limit = 70
  const lines = content.split(/\r?\n/)
  let col = err.col
  let line = lines[err.line - 1]

  if (!line && !col) {
    line = lines[err.line - 2]
    col = line.length
  }

  if (line) {
    if (col > limit) {
      line = line.slice(col - limit)
      col = limit
    }

    msg += '\n\n'
    msg += line.slice(0, 80)
    msg += '\n'
    msg += line.slice(0, col).replace(/\S/g, ' ')
    msg += '^'
  }

  err.message = msg
  return err
}
