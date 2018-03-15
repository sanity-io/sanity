const path = require('path')
const semver = require('semver')
const resolveFrom = require('resolve-from')
const generateHelpUrl = require('@sanity/generate-help-url')

const supported = {
  react: '^15 || ^16',
  'react-dom': '^15 || ^16'
}
const deprecated = {
  react: '^15',
  'react-dom': '^15'
}

module.exports = workDir => {
  const manifest = require(path.join(workDir, 'package.json'))
  const dependencies = Object.assign({}, manifest.dependencies, manifest.devDependencies)

  Object.keys(supported).forEach(pkg => {
    if (!dependencies[pkg]) {
      return
    }

    const manifestPath = resolveFrom.silent(workDir, path.join(pkg, 'package.json'))
    const installed = manifestPath
      ? require(manifestPath).version
      : dependencies[pkg].replace(/[\D.]/g, '')

    if (semver.satisfies(installed, deprecated[pkg])) {
      console.warn(
        `[WARN] ${pkg} ${
          deprecated[pkg]
        } is deprecated and will be unsupported as of the next release of Sanity. Please upgrade the ${pkg} package. Read more at ${generateHelpUrl(
          'upgrade-react'
        )} `
      )
    }
    if (!semver.satisfies(installed, supported[pkg])) {
      throw new Error(
        `Sanity currently only supports ${pkg}@${supported[pkg]}. Installed version: ${installed}.`
      )
    }
  })
}
