const path = require('path')
const fse = require('fs-extra')
const simpleGet = require('simple-get')
const decompress = require('decompress')
const validateNpmPackageName = require('validate-npm-package-name')
const {pathTools} = require('@sanity/util')
const {absolutify, pathIsEmpty} = pathTools

module.exports = async (context, url) => {
  const {prompt, workDir} = context
  const inProjectContext = workDir !== process.cwd()

  let zip
  try {
    zip = await getZip(url)
  } catch (err) {
    err.message = `Failed to get template: ${err.message}`
    throw err
  }

  const manifest = zip.find(file => path.basename(file.path) === 'package.json')
  const baseDir = path.join(path.dirname(manifest.path), 'template')
  const templateFiles = zip.filter(file => file.type === 'file' && file.path.indexOf(baseDir) === 0)
  const manifestContent = manifest.data.toString()
  const tplVars = parseJson(manifestContent).sanityTemplate || {}

  const name = await prompt.single({
    type: 'input',
    message: 'Plugin name:',
    default: tplVars.suggestedName || '',
    validate: pkgName => {
      const {validForNewPackages, errors} = validateNpmPackageName(pkgName)
      return validForNewPackages ? true : errors[0]
    }
  })

  let outputPath = path.join(workDir, 'plugins', name)
  if (!inProjectContext) {
    outputPath = await prompt.single({
      type: 'input',
      message: 'Output path:',
      default: workDir,
      validate: validateEmptyPath,
      filter: absolutify
    })
  }

  let createConfig = tplVars.requiresConfig
  if (typeof createConfig === 'undefined') {
    createConfig = await prompt.single({
      type: 'confirm',
      message: 'Does the plugin need a configuration file?',
      default: false
    })
  }

  await fse.ensureDir(outputPath)
  await Promise.all(
    templateFiles.map(file => {
      const filename = file.path.slice(baseDir.length)
      return fse.outputFile(path.join(outputPath, filename), file.data)
    })
  )

  return {name, outputPath, inPluginsPath: inProjectContext}
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
