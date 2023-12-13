import path from 'path'
import fs from 'fs/promises'
import chalk from 'chalk'
import {debug} from '../../debug'
import {studioDependencies} from '../../studioDependencies'
import type {CliCommandContext} from '../../types'
import {resolveLatestVersions} from '../../util/resolveLatestVersions'
import {copy} from '../../util/copy'
import {createPackageManifest} from './createPackageManifest'
import {createCliConfig} from './createCliConfig'
import {createStudioConfig, GenerateConfigOptions} from './createStudioConfig'
import type {ProjectTemplate} from './initProject'
import templates from './templates'
import {
  assembeBuilderIndexContent,
  builderSchemaToFileContents,
  fetchBuilderSchema,
} from '../../util/builderSchema'

export interface BootstrapOptions {
  packageName: string
  templateName: string
  /**
   * Used for initializing a project from a Schema Builder schema.
   * This will override the `template` option.
   * @beta
   */
  schemaId?: string
  outputPath: string
  useTypeScript: boolean
  variables: GenerateConfigOptions['variables']
}

export async function bootstrapTemplate(
  opts: BootstrapOptions,
  context: CliCommandContext,
): Promise<ProjectTemplate> {
  const {apiClient, cliRoot, output} = context
  const templatesDir = path.join(cliRoot, 'templates')
  const {outputPath, templateName, useTypeScript, packageName, variables} = opts
  const {projectId} = variables
  const sourceDir = path.join(templatesDir, templateName)
  const sharedDir = path.join(templatesDir, 'shared')

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
  await copy(path.join(sharedDir, 'gitignore.txt'), outputPath, {rename: () => '.gitignore'})

  if (useTypeScript) {
    await fs.copyFile(path.join(sharedDir, 'tsconfig.json'), path.join(outputPath, 'tsconfig.json'))
  }

  // If we have a schemaId, the template is assembled from the builder schema
  if (opts.schemaId) {
    debug('Fetching builder schema "%s"', opts.schemaId)
    const documents = await fetchBuilderSchema(opts.schemaId)
    const ext = useTypeScript ? 'ts' : 'js'
    for (const document of documents) {
      debug('Writing schema file for "%s"', document.name)
      const schemaPath = path.join(outputPath, 'schemas', `${document.name}.${ext}`)
      const fileContents = builderSchemaToFileContents(document)
      await fs.mkdir(path.dirname(schemaPath), {recursive: true})
      await fs.writeFile(schemaPath, fileContents)
    }
    debug('Assembling and overwriting the existing index file for schemas')
    const indexContent = assembeBuilderIndexContent(documents)
    await fs.writeFile(path.join(outputPath, 'schemas', `index.${ext}`), indexContent)
  }

  spinner.succeed()

  // Merge global and template-specific plugins and dependencies

  // Resolve latest versions of Sanity-dependencies
  spinner = output.spinner('Resolving latest module versions').start()
  const dependencyVersions = await resolveLatestVersions({
    ...studioDependencies.dependencies,
    ...studioDependencies.devDependencies,
    ...(template.dependencies || {}),
  })
  spinner.succeed()

  // Use the resolved version for the given dependency
  const dependencies = Object.keys({
    ...studioDependencies.dependencies,
    ...template.dependencies,
  }).reduce(
    (deps, dependency) => {
      deps[dependency] = dependencyVersions[dependency]
      return deps
    },
    {} as Record<string, string>,
  )

  const devDependencies = Object.keys({
    ...studioDependencies.devDependencies,
    ...template.devDependencies,
  }).reduce(
    (deps, dependency) => {
      deps[dependency] = dependencyVersions[dependency]
      return deps
    },
    {} as Record<string, string>,
  )

  // Now create a package manifest (`package.json`) with the merged dependencies
  spinner = output.spinner('Creating default project files').start()
  const packageManifest = await createPackageManifest({
    name: packageName,
    dependencies,
    devDependencies,
  })

  // ...and a studio config (`sanity.config.[ts|js]`)
  const studioConfig = await createStudioConfig({
    template: template.configTemplate,
    variables,
  })

  // ...and a CLI config (`sanity.cli.[ts|js]`)
  const cliConfig = await createCliConfig({
    projectId: variables.projectId,
    dataset: variables.dataset,
  })

  // Write non-template files to disc
  const codeExt = useTypeScript ? 'ts' : 'js'
  await Promise.all([
    writeFileIfNotExists(`sanity.config.${codeExt}`, studioConfig),
    writeFileIfNotExists(`sanity.cli.${codeExt}`, cliConfig),
    writeFileIfNotExists('package.json', packageManifest),
    writeFileIfNotExists(
      '.eslintrc',
      `${JSON.stringify({extends: '@sanity/eslint-config-studio'}, null, 2)}\n`,
    ),
  ])

  // Store template name metadata on project
  try {
    await apiClient({api: {projectId}}).request({
      method: 'PATCH',
      uri: `/projects/${projectId}`,
      body: {metadata: {initialTemplate: `cli-${templateName}`}},
    })
  } catch (err: unknown) {
    // Non-critical that we update this metadata, and user does not need to be aware
    let message = typeof err === 'string' ? err : '<unknown error>'
    if (err instanceof Error) {
      message = err.message
    }

    debug('Failed to update initial template metadata for project: %s', message)
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
