import path from 'path'
import chalk from 'chalk'
import fse from 'fs-extra'
import {union, difference} from 'lodash'
import {debug} from '../../debug'
import versionRanges from '../../versionRanges'
import type {CliCommandContext} from '../../types'
import {resolveLatestVersions} from '../../util/resolveLatestVersions'
import {createPackageManifest, createSanityManifest} from './createManifest'
import type {InitOptions, ProjectTemplate} from './initProject'
import templates from './templates'

export default async (opts: InitOptions, context: CliCommandContext): Promise<ProjectTemplate> => {
  const {apiClient, cliRoot, output} = context
  const templatesDir = path.join(cliRoot, 'templates')
  const sourceDir = path.join(templatesDir, opts.template)
  const {outputDir, projectId, template: templateName} = opts

  // Check that we have a template info file (dependencies, plugins etc)
  const template = templates[templateName]
  if (!template) {
    throw new Error(`Template "${templateName}" not defined`)
  }

  // Copy template files
  debug('Copying files from template "%s" to "%s"', templateName, outputDir)
  let spinner = output.spinner('Bootstrapping files from template').start()
  await fse.copy(sourceDir, outputDir, {
    overwrite: false,
    errorOnExist: true,
  })
  spinner.succeed()

  // Merge global and template-specific plugins and dependencies
  const allModules: Record<string, string> = {
    ...versionRanges.core,
    ...(template.dependencies || {}),
  }
  const modules = union(Object.keys(versionRanges.core), Object.keys(template.dependencies || {}))

  // Resolve latest versions of Sanity-dependencies
  spinner = output.spinner('Resolving latest module versions').start()
  const firstParty = modules.filter(isFirstParty)
  const thirdParty = difference(modules, firstParty)
  const firstPartyVersions = await resolveLatestVersions(firstParty, {asRange: true})
  const thirdPartyVersions = thirdParty.reduce((acc, dep) => {
    acc[dep] = allModules[dep]
    return acc
  }, {} as Record<string, string>)
  const dependencies = {...firstPartyVersions, ...thirdPartyVersions}
  spinner.succeed()

  // Now create a package manifest (`package.json`) with the merged dependencies
  spinner = output.spinner('Creating default project files').start()
  const packageManifest = await createPackageManifest({
    name: opts.name,
    dependencies,
  })

  // ...and a `sanity.json` manifest
  const baseSanityManifest = await createSanityManifest(opts)
  const sanityManifest = template.generateSanityManifest
    ? template.generateSanityManifest(baseSanityManifest, opts)
    : baseSanityManifest

  // Write non-template files to disc
  await Promise.all([
    writeFileIfNotExists('sanity.json', `${JSON.stringify(sanityManifest, null, 2)}\n`),
    writeFileIfNotExists('package.json', packageManifest),
    writeFileIfNotExists(
      '.eslintrc',
      `${JSON.stringify({extends: '@sanity/eslint-config-studio'}, null, 2)}\n`
    ),
  ])

  // Store template name metadata on project
  try {
    await apiClient({api: {projectId}}).request({
      method: 'PATCH',
      uri: `/projects/${projectId}`,
      body: {metadata: {initialTemplate: `cli-${templateName}`}},
    })
  } catch (err) {
    if (err.statusCode === 401) {
      output.warn(`\n${chalk.yellow('⚠')} Unauthorized to update metadata for this project`)
    } else {
      output.warn(`\n${chalk.red('⚠')} ${err.message}`)
    }
  }

  // Finish up by providing init process with template-specific info
  spinner.succeed()
  return template

  async function writeFileIfNotExists(fileName: string, content: string): Promise<void> {
    const filePath = path.join(outputDir, fileName)
    try {
      await fse.writeFile(filePath, content, {flag: 'wx'})
    } catch (err) {
      if (err.code === 'EEXIST') {
        output.warn(`\n${chalk.yellow('⚠')} File "${filePath}" already exists, skipping`)
      } else {
        throw err
      }
    }
  }
}

function isFirstParty(pkg: string): boolean {
  return pkg.indexOf('@sanity/') === 0
}
