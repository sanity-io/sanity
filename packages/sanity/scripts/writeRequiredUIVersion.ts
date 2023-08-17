// // This overwrites the compiled ./lib/requiredSanityUiVersion.js with a the
// // actual version we currently depend on in the `sanity` module
// import fs from 'fs/promises'
// import pkg from '../package.json'

// const template = (version: string) => `exports.REQUIRED_UI_VERSION = '${version}'`

// let builtFile
// try {
//   builtFile = require.resolve('../lib/cjs/requiredSanityUiVersion.js')
// } catch (error) {
//   // eslint-disable-next-line no-console
//   console.error(
//     'Error: Unable to resolve "requiredSanityUiVersion.js" in ./lib. Please make sure the project has been successfully built.'
//   )
//   process.exit(1)
// }

// let version = pkg.dependencies['@sanity/ui']

// if (typeof version === 'string' && version.startsWith('^')) {
//   version = version.slice(1)
// }

// fs.writeFile(builtFile, template(version || 'latest'))

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable no-process-exit */
/* eslint-disable no-sync */

import fs from 'fs'
import path from 'path'
import globby from 'globby'
import semver from 'semver'
import pkg from '../package.json'

const rawVersion = pkg.dependencies['@sanity/ui']
const v = semver.parse(
  rawVersion.startsWith('^') || rawVersion.startsWith('~') ? rawVersion.slice(1) : rawVersion,
)

if (!v) {
  console.log(`the version of @sanity/ui is invalid: ${rawVersion}`)
  process.exit(1)
}

const version = `${v.major}.${v.minor}.${v.patch}`

globby([
  path.resolve(__dirname, '../lib/**/*.js'),
  path.resolve(__dirname, '../lib/**/*.mjs'),
]).then((files) => {
  for (const file of files) {
    const buf = fs.readFileSync(file, 'utf8')
    fs.writeFileSync(
      file,
      buf
        .toString()
        .replace('REQUIRED_UI_VERSION="0.0.0-development"', `REQUIRED_UI_VERSION="${version}"`),
      'utf8',
    )
  }
})
