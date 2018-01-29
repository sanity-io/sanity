import fse from 'fs-extra'
import UglifyJS from 'uglify-es'

export default async inputFile => {
  const content = await fse.readFile(inputFile, 'utf8')
  const minified = await minify(content, inputFile)
  await fse.outputFile(inputFile, minified)
}

function minify(content, fileName) {
  return new Promise((resolve, reject) => {
    const result = UglifyJS.minify(content)

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
