const path = require('path')
const semver = require('semver')
const fse = require('fs-extra')
const simpleGet = require('simple-get')
const decompress = require('decompress')
const resolveFrom = require('resolve-from')
const validateNpmPackageName = require('validate-npm-package-name')
const {pathTools} = require('@sanity/util')
const dynamicRequire = require('../../util/dynamicRequire')
const pkg = require('../../../package.json')
const debug = require('../../debug')

const {absolutify, pathIsEmpty} = pathTools

module.exports = async (context, url) => {
  const {prompt, workDir} = context
  let inProjectContext = false
  try {
    const projectManifest = await fse.readJson(path.join(workDir, 'sanity.json'))
    inProjectContext = Boolean(projectManifest.root)
  } catch (err) {
    // Intentional noop
  }

  debug(inProjectContext ? 'Project context found' : 'Not in project context')

  let zip
  try {
    debug('Fetching zip from %s', url)
    zip = await getZip(url)
    debug('Zip finished downloading')
  } catch (err) {
    err.message = `Failed to get template: ${err.message}`
    throw err
  }

  debug('Looking up template manifest from zip')
  const manifest = zip.find(
    (file) => path.basename(file.path) === 'package.json' && !file.path.includes('node_modules')
  )

  if (!manifest) {
    throw new Error('Could not find `package.json` in template')
  }

  // Note: Paths inside the zips are always unix-style, so do not use `path.join` here
  const baseDir = `${path.dirname(manifest.path)}/template`
  debug('Manifest path resolved to %s', manifest.path)
  debug('Base directory resolved to %s', baseDir)

  const templateFiles = zip.filter(
    (file) => file.type === 'file' && file.path.indexOf(baseDir) === 0
  )
  debug('%d files found in template', templateFiles.length)

  const manifestContent = manifest.data.toString()
  const tplVars = parseJson(manifestContent).sanityTemplate || {}
  const {minimumBaseVersion, minimumCliVersion} = tplVars

  if (minimumBaseVersion) {
    debug('Template requires Sanity version %s', minimumBaseVersion)
    const installed = getSanityVersion(workDir)
    debug('Installed Sanity version is %s', installed)

    if (semver.lt(installed, minimumBaseVersion)) {
      throw new Error(
        `Template requires Sanity at version ${minimumBaseVersion}, installed is ${installed}`
      )
    }
  }

  if (minimumCliVersion) {
    debug('Template requires Sanity CLI version %s', minimumCliVersion)
    debug('Installed CLI version is %s', pkg.version)

    if (semver.lt(pkg.version, minimumCliVersion)) {
      throw new Error(
        `Template requires @sanity/cli at version ${minimumCliVersion}, installed is ${pkg.version}`
      )
    }
  }

  const name = await prompt.single({
    type: 'input',
    message: 'Plugin name:',
    default: tplVars.suggestedName || '',
    validate: async (pkgName) => {
      const {validForNewPackages} = validateNpmPackageName(pkgName)
      if (!validForNewPackages) {
        return 'Name must be a valid npm package name (https://docs.npmjs.com/files/package.json#name)'
      }

      const outputPath = path.join(workDir, 'plugins', pkgName)
      const isEmpty = await pathIsEmpty(outputPath)
      if (inProjectContext && !isEmpty) {
        return 'Plugin with given name already exists in project'
      }

      return true
    },
  })

  let outputPath = path.join(workDir, 'plugins', name)
  if (!inProjectContext) {
    const cwdIsEmpty = await pathIsEmpty(workDir)
    outputPath = await prompt.single({
      type: 'input',
      message: 'Output path:',
      default: cwdIsEmpty ? workDir : path.join(workDir, name),
      validate: validateEmptyPath,
      filter: absolutify,
    })
  }

  debug('Output path set to %s', outputPath)

  let createConfig = tplVars.requiresConfig
  if (typeof createConfig === 'undefined') {
    createConfig = await prompt.single({
      type: 'confirm',
      message: 'Does the plugin need a configuration file?',
      default: false,
    })
  }

  debug('Ensuring directory exists: %s', outputPath)
  await fse.ensureDir(outputPath)

  await Promise.all(
    templateFiles.map((file) => {
      const filename = file.path.slice(baseDir.length)

      debug('Writing template file "%s" to "%s"', filename, outputPath)
      return fse.outputFile(path.join(outputPath, filename), file.data)
    })
  )

  return {name, outputPath, inPluginsPath: inProjectContext, dependencies: tplVars.dependencies}
}

async function validateEmptyPath(dir) {
  const isEmpty = await pathIsEmpty(dir)
  return isEmpty ? true : 'Path is not empty'
}

function getZip(url) {
  return new Promise((resolve, reject) => {
    simpleGet.concat(url, (err, res, data) => {
      if (err) {
        reject(err)
        return
      }

      if (res.statusCode > 299) {
        const httpErr = ['HTTP', res.statusCode, res.statusMessage].filter(Boolean).join(' ')
        reject(new Error(`${httpErr} trying to download ${url}`))
        return
      }

      resolve(decompress(data))
    })
  })
}

function parseJson(json) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return {}
  }
}

function getSanityVersion(workDir) {
  const basePkg = resolveFrom.silent(workDir, '@sanity/base/package.json')
  return basePkg ? dynamicRequire(basePkg).version : pkg.version
}
