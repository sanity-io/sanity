import path from 'path'
import fse from 'fs-extra'
import {union, difference} from 'lodash'
import debug from '../../debug'
import versionRanges from '../../versionRanges'
import resolveLatestVersions from '../../util/resolveLatestVersions'
import {createPackageManifest, createSanityManifest} from './createManifest'
import templates from './templates'

export default async (opts, context) => {
  const {output, cliRoot} = context
  const templatesDir = path.join(cliRoot, 'templates')
  const sourceDir = path.join(templatesDir, opts.template)
  const outputDir = opts.outputDir

  // Check that we have a template info file (dependencies, plugins etc)
  const template = templates[opts.template]
  if (!template) {
    throw new Error(`Template "${opts.template}" not defined`)
  }

  // Copy template files
  debug('Copying files from template "%s" to "%s"', opts.template, outputDir)
  let spinner = output.spinner('Bootstrapping files from template').start()
  await fse.copy(sourceDir, outputDir, {
    overwrite: false,
    errorOnExist: true,
  })
  spinner.succeed()

  // Merge global and template-specific plugins and dependencies
  const allModules = Object.assign({}, versionRanges.core, template.dependencies || {})
  const modules = union(Object.keys(versionRanges.core), Object.keys(template.dependencies || {}))

  // Resolve latest versions of Sanity-dependencies
  spinner = output.spinner('Resolving latest module versions').start()
  const firstParty = modules.filter(isFirstParty)
  const thirdParty = difference(modules, firstParty)
  const firstPartyVersions = await resolveLatestVersions(firstParty, {asRange: true})
  const thirdPartyVersions = thirdParty.reduce((acc, dep) => {
    acc[dep] = allModules[dep]
    return acc
  }, {})
  const dependencies = Object.assign({}, firstPartyVersions, thirdPartyVersions)
  spinner.succeed()

  // Now create a package manifest (`package.json`) with the merged dependencies
  spinner = output.spinner('Creating default project files').start()
  const packageManifest = await createPackageManifest({...opts, dependencies})

  // ...and a `sanity.json` manifest
  const baseSanityManifest = await createSanityManifest(opts, {serialize: false})
  const sanityManifest = template.generateSanityManifest
    ? template.generateSanityManifest(baseSanityManifest, opts)
    : baseSanityManifest

  // Write non-template files to disc
  await Promise.all([
    writeFileIfNotExists('sanity.json', `${JSON.stringify(sanityManifest, null, 2)}\n`),
    writeFileIfNotExists('package.json', packageManifest),
  ])

  // Finish up by providing init process with template-specific info
  spinner.succeed()
  return template

  async function writeFileIfNotExists(fileName, content) {
    const filePath = path.join(outputDir, fileName)
    try {
      await fse.writeFile(filePath, content, {flag: 'wx'})
    } catch (err) {
      if (err.code === 'EEXIST') {
        output.print(`\n[WARN] File "${filePath}" already exists, skipping`)
      } else {
        throw err
      }
    }
  }
}

function isFirstParty(pkg) {
  return pkg.indexOf('@sanity/') === 0
}
