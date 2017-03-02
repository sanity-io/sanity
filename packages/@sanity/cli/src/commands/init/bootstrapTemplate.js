import path from 'path'
import fsp from 'fs-promise'
import {union} from 'lodash'
import debug from '../../debug'
import versionRanges from '../../versionRanges'
import resolveLatestVersions from '../../util/resolveLatestVersions'
import {createPackageManifest, createSanityManifest} from './createManifest'

const templatesDir = path.join(__dirname, '..', '..', '..', 'templates')

export default async (opts, context) => {
  const {output} = context
  const sourceDir = path.join(templatesDir, opts.template)
  const templateConfigPath = path.join(__dirname, 'templates', `${opts.template}.js`)
  const outputDir = opts.outputDir

  // Check that we have a template info file (dependencies, plugins etc)
  let template = null
  try {
    template = require(templateConfigPath)
  } catch (err) {
    throw new Error(`Failed to read template info from "${templateConfigPath}"`)
  }

  // Copy template files
  debug('Copying files from template "%s" to "%s"', opts.template, outputDir)
  let spinner = output.spinner('Bootstrapping files from template').start()
  await fsp.copy(sourceDir, outputDir, {
    overwrite: false,
    errorOnExist: true
  })
  spinner.succeed()

  // Merge global and template-specific plugins and dependencies
  const modules = union(
    Object.keys(versionRanges.core),
    Object.keys(template.dependencies || {})
  )

  // Resolve latest versions of dependencies
  spinner = output.spinner('Resolving latest module versions').start()
  const dependencies = await resolveLatestVersions(modules, {asRange: true})
  spinner.succeed()

  // Now create a package manifest (`package.json`) with the merged dependencies
  const packageManifest = await createPackageManifest({...opts, dependencies})

  // ...and a `sanity.json` manifest
  const baseSanityManifest = await createSanityManifest(opts, {serialize: false})
  const sanityManifest = template.generateSanityManifest
    ? template.generateSanityManifest(baseSanityManifest, opts)
    : baseSanityManifest

  // Generate a basic readme
  const readme = [
    `# ${opts.name}`, '',
    opts.description, '',
    '## Running', '',
    '```',
    'npm install',
    'npm start',
    '```', ''
  ].join('\n')

  // Write non-template files to disc
  await Promise.all([
    writeFileIfNotExists('README.md', readme),
    writeFileIfNotExists('sanity.json', `${JSON.stringify(sanityManifest, null, 2)}\n`),
    writeFileIfNotExists('package.json', packageManifest),
  ])

  // Finish up by providing init process with template-specific info
  return template

  async function writeFileIfNotExists(fileName, content) {
    const filePath = path.join(outputDir, fileName)
    try {
      await fsp.writeFile(filePath, content, {flag: 'wx'})
    } catch (err) {
      if (err.code === 'EEXIST') {
        output.print(`[WARN] File "${filePath}" already exists, skipping`)
      } else {
        throw err
      }
    }
  }
}
