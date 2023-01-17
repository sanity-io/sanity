import path from 'path'
import fs from 'fs/promises'
import semver from 'semver'
import {getIt} from 'get-it'
import {promise} from 'get-it/middleware'
import decompress from 'decompress'
import resolveFrom from 'resolve-from'
import validateNpmPackageName from 'validate-npm-package-name'
import {absolutify, pathIsEmpty} from '@sanity/util/fs'
import {getCliVersion} from '../../util/getCliVersion'
import {readJson} from '../../util/readJson'
import {dynamicRequire} from '../../util/dynamicRequire'
import {SanityJson} from '../../types'
import {debug} from '../../debug'
import {CliCommandContext} from '../..'

const request = getIt([promise()])

interface TemplateManifest {
  sanityTemplate: {
    minimumBaseVersion?: string
    minimumCliVersion?: string
    suggestedName?: string
    requiresConfig?: boolean
    dependencies?: Record<string, string>
  }
}

export async function bootstrapFromTemplate(
  context: CliCommandContext,
  url: string
): Promise<{
  name: string
  outputPath: string
  inPluginsPath: boolean
  dependencies: any
}> {
  const {prompt, workDir} = context
  const cliVersion = await getCliVersion()
  let inProjectContext = false
  try {
    const projectManifest = await readJson<SanityJson>(path.join(workDir, 'sanity.json'))
    inProjectContext = Boolean(projectManifest.root)
  } catch (err) {
    // Intentional noop
  }

  debug(inProjectContext ? 'Project context found' : 'Not in project context')

  let zip: decompress.File[]
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

  const manifestContent = parseJson<TemplateManifest>(manifest.data.toString())
  const tplVars = manifestContent?.sanityTemplate || {}
  const {minimumBaseVersion, minimumCliVersion} = tplVars

  if (minimumBaseVersion) {
    debug('Template requires Sanity version %s', minimumBaseVersion)
    const installed = getSanityVersion(workDir, cliVersion)
    debug('Installed Sanity version is %s', installed)

    if (semver.lt(installed, minimumBaseVersion)) {
      throw new Error(
        `Template requires Sanity at version ${minimumBaseVersion}, installed is ${installed}`
      )
    }
  }

  if (minimumCliVersion) {
    debug('Template requires Sanity CLI version %s', minimumCliVersion)
    debug('Installed CLI version is %s', cliVersion)

    if (semver.lt(cliVersion, minimumCliVersion)) {
      throw new Error(
        `Template requires @sanity/cli at version ${minimumCliVersion}, installed is ${cliVersion}`
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
  await fs.mkdir(outputPath, {recursive: true})

  await Promise.all(
    templateFiles.map((file: {path: string; data: string | Buffer}) => {
      const filename = file.path.slice(baseDir.length)

      debug('Writing template file "%s" to "%s"', filename, outputPath)
      return fs.writeFile(path.join(outputPath, filename), file.data)
    })
  )

  return {name, outputPath, inPluginsPath: inProjectContext, dependencies: tplVars.dependencies}
}

async function validateEmptyPath(dir: string) {
  const isEmpty = await pathIsEmpty(dir)
  return isEmpty ? true : 'Path is not empty'
}

function getZip(url: string): Promise<decompress.File[]> {
  return request({url, rawBody: true}).then(
    (res: {statusCode: number; statusMessage: string; body: Buffer}) => {
      if (res.statusCode > 299) {
        const httpErr = ['HTTP', res.statusCode, res.statusMessage].filter(Boolean).join(' ')
        throw new Error(`${httpErr} trying to download ${url}`)
      }

      return decompress(res.body)
    }
  )
}

function parseJson<T = any>(json: string): T | undefined {
  try {
    return JSON.parse(json)
  } catch (err) {
    return undefined
  }
}

function getSanityVersion(workDir: string, fallback: string): string {
  // This is only used in v2, thus `@sanity/base`
  const basePkg = resolveFrom.silent(workDir, '@sanity/base/package.json')
  return basePkg ? dynamicRequire(basePkg).version : fallback
}
