import {mkdir} from 'node:fs/promises'
import {join} from 'node:path'

import {debug} from '../../debug'
import {type CliCommandContext} from '../../types'
import {
  applyEnvVariables,
  downloadAndExtractRepo,
  generateSanityApiReadToken,
  getMonoRepo,
  isNextJsTemplate,
  type RepoInfo,
  tryApplyPackageName,
  validateRemoteTemplate,
} from '../../util/remoteTemplate'
import {type GenerateConfigOptions} from './createStudioConfig'
import {tryGitInit} from './git'
import {updateInitialTemplateMetadata} from './updateInitialTemplateMetadata'

export interface BootstrapRemoteOptions {
  outputPath: string
  repoInfo: RepoInfo
  bearerToken?: string
  packageName: string
  variables: GenerateConfigOptions['variables']
}

const INITIAL_COMMIT_MESSAGE = 'Initial commit from Sanity CLI'

export async function bootstrapRemoteTemplate(
  opts: BootstrapRemoteOptions,
  context: CliCommandContext,
): Promise<void> {
  const {outputPath, repoInfo, bearerToken, variables, packageName} = opts
  const {output, apiClient} = context
  const name = [repoInfo.username, repoInfo.name, repoInfo.filePath].filter(Boolean).join('/')
  const spinner = output.spinner(`Bootstrapping files from template "${name}"`).start()

  debug('Validating remote template')
  const packages = await getMonoRepo(repoInfo, bearerToken)
  await validateRemoteTemplate(repoInfo, packages, bearerToken)

  debug('Create new directory "%s"', outputPath)
  await mkdir(outputPath, {recursive: true})

  debug('Downloading and extracting repo to %s', outputPath)
  await downloadAndExtractRepo(outputPath, repoInfo, bearerToken)

  debug('Applying environment variables')
  const readToken = await generateSanityApiReadToken(variables.projectId, apiClient)
  const isNext = await isNextJsTemplate(outputPath)
  const envName = isNext ? '.env.local' : '.env'

  for (const folder of packages ?? ['']) {
    const path = join(outputPath, folder)
    await applyEnvVariables(path, {...variables, readToken}, envName)
  }

  debug('Setting package name to %s', packageName)
  await tryApplyPackageName(outputPath, packageName)

  debug('Initializing git repository')
  tryGitInit(outputPath, INITIAL_COMMIT_MESSAGE)

  debug('Updating initial template metadata')
  await updateInitialTemplateMetadata(apiClient, variables.projectId, `external-${name}`)

  spinner.succeed()
}
