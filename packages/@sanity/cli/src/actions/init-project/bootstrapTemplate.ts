import path from 'path'
import fs from 'fs/promises'
import chalk from 'chalk'
import {debug} from '../../debug'
import versionRanges from '../../versionRanges'
import type {CliCommandContext} from '../../types'
import {resolveLatestVersions} from '../../util/resolveLatestVersions'
import {copy} from '../../util/copy'
import {createPackageManifest} from './createPackageManifest'
import {createStudioConfig, GenerateConfigOptions} from './createStudioConfig'
import type {ProjectTemplate} from './initProject'
import templates from './templates'

export interface BootstrapOptions {
  packageName: string
  templateName: string
  outputPath: string
  useTypeScript: boolean
  variables: GenerateConfigOptions['variables']
}

export async function bootstrapTemplate(
  opts: BootstrapOptions,
  context: CliCommandContext
): Promise<ProjectTemplate> {
  const {apiClient, cliRoot, output} = context
  const templatesDir = path.join(cliRoot, 'templates')
  const {outputPath, templateName, useTypeScript, packageName, variables} = opts
  const {projectId} = variables
  const sourceDir = path.join(templatesDir, templateName)

  // Check that we have a template info file (dependencies, plugins etc)
  const template = templates[templateName]
  if (!template) {
    throw new Error(`Template "${templateName}" not defined`)
  }

  // Copy template files
  debug('Copying files from template "%s" to "%s"', templateName, outputPath)
  let spinner = output.spinner('Bootstrapping files from template').start()
  await copy(sourceDir, outputPath, {
    rename: useTypeScript ? toTypeScriptPath : undefined,
  })
  spinner.succeed()

  // Merge global and template-specific plugins and dependencies

  // Resolve latest versions of Sanity-dependencies
  spinner = output.spinner('Resolving latest module versions').start()
  const dependencies = await resolveLatestVersions({
    ...versionRanges.core,
    ...(template.dependencies || {}),
  })
  spinner.succeed()

  // Now create a package manifest (`package.json`) with the merged dependencies
  spinner = output.spinner('Creating default project files').start()
  const packageManifest = await createPackageManifest({
    name: packageName,
    dependencies,
  })

  // ...and a studio config (`sanity.config.[ts|js]`)
  const studioConfig = await createStudioConfig({
    template: template.configTemplate,
    variables,
  })

  // Write non-template files to disc
  const codeExt = useTypeScript ? 'ts' : 'js'
  await Promise.all([
    writeFileIfNotExists(`sanity.config.${codeExt}`, studioConfig),
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
    const filePath = path.join(outputPath, fileName)
    try {
      await fs.writeFile(filePath, content, {flag: 'wx'})
    } catch (err) {
      if (err.code === 'EEXIST') {
        output.warn(`\n${chalk.yellow('⚠')} File "${filePath}" already exists, skipping`)
      } else {
        throw err
      }
    }
  }
}

function toTypeScriptPath(originalPath: string): string {
  return originalPath.replace(/\.js$/, '.ts')
}
