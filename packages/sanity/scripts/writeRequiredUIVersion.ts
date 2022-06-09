// This overwrites the compiled ./lib/requiredSanityUiVersion.js with a the
// actual version we currently depend on in the `sanity` module
// @todo see if we can import directly from `package.json` and read the version there,
// @todo and use the `inline-json-import` babel plugin to avoid needing this
import fs from 'fs/promises'
import pkg from '../package.json'

const template = (version: string) => `exports.REQUIRED_UI_VERSION = '${version}'`

let builtFile
try {
  builtFile = require.resolve('../lib/cjs/requiredSanityUiVersion.js')
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(
    'Error: Unable to resolve "requiredSanityUiVersion.js" in ./lib. Please make sure the project has been successfully built.'
  )
  process.exit(1)
}

let version = pkg.dependencies['@sanity/ui']

if (typeof version === 'string' && version.startsWith('^')) {
  version = version.slice(1)
}

fs.writeFile(builtFile, template(version || 'latest'))
