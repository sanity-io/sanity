import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import atImport from 'postcss-import'
import nested from 'postcss-nested'

const processor = postcss([
  atImport,
  autoprefixer,
  nested
].filter(Boolean))

export default {
  '/stylesheets/main.css'() {
    const sourceFile = path.join(__dirname, '../stylesheets/main.css')
    return new Promise((resolve, reject) => {
      fs.readFile(sourceFile, (err, buf) => {
        if (err) {
          reject(err)
          return
        }
        resolve(buf)
      })
    })
      .then(buf => processor.process(buf, {
        from: sourceFile,
        to: '/stylesheets/main.css',
        map: {inline: true}
      }))
      .then(result => result.css)
  }
}
