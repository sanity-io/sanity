import fs from 'node:fs/promises'
import path from 'node:path'

import chalk from 'chalk'

import {debug} from '../../debug'
import {studioDependencies} from '../../studioDependencies'
import {type CliCommandContext} from '../../types'
import {copy} from '../../util/copy'
import {getAndWriteJourneySchemaWorker} from '../../util/journeyConfig'
import {resolveLatestVersions} from '../../util/resolveLatestVersions'
import {createCliConfig} from './createCliConfig'
import {createCoreAppCliConfig} from './createCoreAppCliConfig'
import {createPackageManifest} from './createPackageManifest'
import {createStudioConfig, type GenerateConfigOptions} from './createStudioConfig'
import {determineCoreAppTemplate} from './determineCoreAppTemplate'
import {type ProjectTemplate} from './initProject'
import templates from './templates'
import {updateInitialTemplateMetadata} from './updateInitialTemplateMetadata'

export interface BootstrapLocalOptions {
  packageName: string
  templateName: string
  /**
   * Used for initializing a project from a server schema that is saved in the Journey API
   * @beta
   */
  schemaUrl?: string
  outputPath: string
  useTypeScript: boolean
  variables: GenerateConfigOptions['variables']
}

export async function bootstrapLocalTemplate(
  opts: BootstrapLocalOptions,
  context: CliCommandContext,
): Promise<ProjectTemplate> {
  const {apiClient, cliRoot, output} = context
  const templatesDir = path.join(cliRoot, 'templates')
  const {outputPath, templateName, useTypeScript, packageName, variables} = opts
  const sourceDir = path.join(templatesDir, templateName)
  const sharedDir = path.join(templatesDir, 'shared')
  const isCoreAppTemplate = determineCoreAppTemplate(templateName)

  // Check that we have a template info file (dependencies, plugins etc)
  const template = templates[templateName]
  if (!template) {
    throw new Error(`Template "${templateName}" not defined`)
  }

  // Copy template files
  debug('Copying files from template "%s" to "%s"', templateName, outputPath)
  let spinner = output
    .spinner(
      opts.schemaUrl ? 'Extracting your Sanity configuration' : 'Bootstrapping files from template',
    )
    .start()

  await copy(sourceDir, outputPath, {
    rename: useTypeScript ? toTypeScriptPath : undefined,
  })
  await copy(path.join(sharedDir, 'gitignore.txt'), outputPath, {rename: () => '.gitignore'})

  if (useTypeScript) {
    await fs.copyFile(path.join(sharedDir, 'tsconfig.json'), path.join(outputPath, 'tsconfig.json'))
  }

  // If we have a schemaUrl, get the schema and write it to disk
  // At this point the selected template should already have been forced to "clean"
  if (opts.schemaUrl) {
    debug('Fetching and writing remote schema "%s"', opts.schemaUrl)
    await getAndWriteJourneySchemaWorker({
      schemasPath: path.join(outputPath, 'schemaTypes'),
      useTypeScript,
      schemaUrl: opts.schemaUrl,
    })
  }

  spinner.succeed()

  // Merge global and template-specific plugins and dependencies

  // Resolve latest versions of Sanity-dependencies
  spinner = output.spinner('Resolving latest module versions').start()
  const dependencyVersions = await resolveLatestVersions({
    ...(isCoreAppTemplate ? {} : studioDependencies.dependencies),
    ...(isCoreAppTemplate ? {} : studioDependencies.devDependencies),
    ...(template.dependencies || {}),
    ...(template.devDependencies || {}),
  })
  spinner.succeed()

  // Use the resolved version for the given dependency
  const dependencies = Object.keys({
    ...(isCoreAppTemplate ? {} : studioDependencies.dependencies),
    ...template.dependencies,
  }).reduce(
    (deps, dependency) => {
      deps[dependency] = dependencyVersions[dependency]
      return deps
    },
    {} as Record<string, string>,
  )

  const devDependencies = Object.keys({
    ...(isCoreAppTemplate ? {} : studioDependencies.devDependencies),
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
    scripts: template.scripts,
  })

  // ...and a studio config (`sanity.config.[ts|js]`)
  const studioConfig = createStudioConfig({
    template: template.configTemplate,
    variables,
  })

  // ...and a CLI config (`sanity.cli.[ts|js]`)
  const cliConfig = isCoreAppTemplate
    ? createCoreAppCliConfig({
        appLocation: template.appLocation!,
        organizationId: variables.organizationId,
      })
    : createCliConfig({
        projectId: variables.projectId,
        dataset: variables.dataset,
        autoUpdates: variables.autoUpdates,
      })

  // Write non-template files to disc
  const codeExt = useTypeScript ? 'ts' : 'js'
  await Promise.all(
    [
      ...[
        isCoreAppTemplate
          ? Promise.resolve(null)
          : writeFileIfNotExists(`sanity.config.${codeExt}`, studioConfig),
      ],
      writeFileIfNotExists(`sanity.cli.${codeExt}`, cliConfig),
      writeFileIfNotExists('package.json', packageManifest),
      writeFileIfNotExists(
        'eslint.config.mjs',
        `import studio from '@sanity/eslint-config-studio'\n\nexport default [...studio]\n`,
      ),
    ].filter(Boolean),
  )

  debug('Updating initial template metadata')
  await updateInitialTemplateMetadata(apiClient, variables.projectId, `cli-${templateName}`)

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
