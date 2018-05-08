const fs = require('fs')

const files = require('export-files')(__dirname)

const fileName = `${__dirname}/index.js`
fs.truncate(fileName, 0, function(){
  console.log('Wiping old file')
})

for (let key in files) {
  if (files.hasOwnProperty(key) && key !== 'createIndex') {
    const line = `export {default as ${key}} from './${key}'\n`
    fs.appendFile(fileName, line, function (err) {
      if (err) {
        console.error(`Could not write: ${line}`)
      } else {
        console.log(`Writing: ${line}`)
      }
    })
  }
}
