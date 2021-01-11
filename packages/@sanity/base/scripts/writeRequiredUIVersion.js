// This overwrites the compiled ./lib/requiredSanityUiVersion.js with a the actual version we currently depend on in @sanity/base
const pkg = require('../package.json')
const fs = require('fs')

const template = (version) => `exports.REQUIRED_UI_VERSION = '${version}'`

let builtFile
try {
  builtFile = require.resolve('../lib/requiredSanityUiVersion.js')
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(
    'Error: Unable to resolve "requiredSanityUiVersion.js" in ./lib. Please make sure the project has been successfully built.'
  )
  process.exit(1)
}

fs.writeFileSync(builtFile, template(pkg.dependencies['@sanity/ui'] || 'latest'))
