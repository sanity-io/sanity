import fse from 'fs-extra'
import UglifyJS from 'uglify-js'

export default async inputFile => {
  const content = await fse.readFile(inputFile, 'utf8')
  const minified = await minify(content)
  await fse.outputFile(inputFile, minified)
}

function minify(content) {
  return new Promise((resolve, reject) => {
    const result = UglifyJS.minify(content)

    if (result.error) {
      reject(result.error)
    } else {
      resolve(result.code)
    }
  })
}
