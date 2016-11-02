/* eslint-disable no-console */
import path from 'path'
import fsp from 'fs-promise'
import got from 'got'

const version = '0.16.1'
const baseUrl = 'https://github.com/yarnpkg/yarn/releases/download'
const bundleUrl = `${baseUrl}/v${version}/yarn-legacy-${version}.js`
const licenseUrl = 'https://raw.githubusercontent.com/yarnpkg/yarn/master/LICENSE'
const destination = path.join(__dirname, '..', '..', 'vendor', 'yarn')
const writeFlags = {encoding: 'utf8', mode: 0o755}

function download() {
  console.log('[package-yarn] Downloading bundle')
  got.stream(bundleUrl).pipe(
    fsp.createWriteStream(destination, writeFlags)
      .on('close', writeHeader)
  )
}

async function writeHeader() {
  console.log('[package-yarn] Downloading license')
  const license = await got(licenseUrl).then(res => res.body)
  const commented = license.split('\n').map(line => ` * ${line}`).join('\n')
  const wrapped = `/*\n${commented}*/`

  console.log('[package-yarn] Reading bundle')
  const bundle = await fsp.readFile(destination, writeFlags)
  if (bundle[0] !== '#' && bundle[1] !== '!') {
    throw new Error('[package-yarn] Expected bundle to start with a shebang (#!), but it did not')
  }

  console.log('[package-yarn] Writing modified bundle')
  const licensed = bundle.replace(/^(#!.*\n)/, `$1${wrapped}\n\n`)
  await fsp.writeFile(destination, licensed, writeFlags)
}

download()
