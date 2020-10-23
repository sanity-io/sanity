/* eslint-disable no-console */
import path from 'path'
import fse from 'fs-extra'
import simpleGet from 'simple-get'

const version = '1.6.0'
const baseUrl = 'https://github.com/yarnpkg/yarn/releases/download'
const bundleUrl = `${baseUrl}/v${version}/yarn-legacy-${version}.js`
const licenseUrl = 'https://raw.githubusercontent.com/yarnpkg/yarn/master/LICENSE'
const destination = path.join(__dirname, '..', '..', 'vendor', 'yarn')
const writeFlags = {encoding: 'utf8', mode: 0o755}
const request = (url) =>
  new Promise((resolve, reject) =>
    simpleGet.concat(url, (err, res, body) => {
      if (err) {
        reject(err)
      } else {
        resolve(body.toString())
      }
    })
  )

function download() {
  console.log('[package-yarn] Downloading bundle')
  simpleGet(bundleUrl, (err, res) => {
    if (err) {
      throw err
    }

    res.pipe(fse.createWriteStream(destination, writeFlags).on('close', writeHeader))
  })
}

async function writeHeader() {
  console.log('[package-yarn] Downloading license')
  const license = await request(licenseUrl)
  const commented = license
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n')
  const wrappedLicense = `/*\n${commented}*/`

  console.log('[package-yarn] Reading bundle')
  const bundle = await fse.readFile(destination, writeFlags)
  if (bundle[0] !== '#' && bundle[1] !== '!') {
    throw new Error('[package-yarn] Expected bundle to start with a shebang (#!), but it did not')
  }

  console.log('[package-yarn] Writing modified bundle')
  const pkgDate = new Date().toISOString().substr(0, 10)
  const versionString = `/* yarn v${version} - packaged ${pkgDate} */`
  const licensed = bundle.replace(/^(#!.*\n)/, `$1${versionString}\n${wrappedLicense}\n\n`)
  await fse.writeFile(destination, licensed, writeFlags)
}

download()
