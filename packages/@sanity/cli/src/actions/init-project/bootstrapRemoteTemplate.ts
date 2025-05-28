import {mkdir} from 'node:fs/promises'
import {join} from 'node:path'

import {getMonoRepo, GitHubFileReader, validateTemplate} from '@sanity/template-validator'
import {type Framework, frameworks} from '@vercel/frameworks'
import {detectFrameworkRecord, LocalFileSystemDetector} from '@vercel/fs-detectors'

import {debug} from '../../debug'
import {type CliCommandContext} from '../../types'
import {getDefaultPortForFramework} from '../../util/frameworkPort'
import {
  applyEnvVariables,
  checkIfNeedsApiToken,
  downloadAndExtractRepo,
  generateSanityApiToken,
  getGitHubRawContentUrl,
  type RepoInfo,
  setCorsOrigin,
  tryApplyPackageName,
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

const SANITY_DEFAULT_PORT = 3333
const READ_TOKEN_LABEL = 'Live Preview API'
const WRITE_TOKEN_LABEL = 'App Write Token'
const INITIAL_COMMIT_MESSAGE = 'Initial commit from Sanity CLI'

export async function bootstrapRemoteTemplate(
  opts: BootstrapRemoteOptions,
  context: CliCommandContext,
): Promise<void> {
  const {outputPath, repoInfo, bearerToken, variables, packageName} = opts
  const {output, apiClient} = context
  const name = [repoInfo.username, repoInfo.name, repoInfo.filePath].filter(Boolean).join('/')
  const contentsUrl = getGitHubRawContentUrl(repoInfo)
  const headers: Record<string, string> = {}
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }
  const spinner = output.spinner(`Bootstrapping files from template "${name}"`).start()
  const corsAdded: number[] = [SANITY_DEFAULT_PORT]

  debug('Validating remote template')
  const fileReader = new GitHubFileReader(contentsUrl, headers)
  const packages = await getMonoRepo(fileReader)
  const validation = await validateTemplate(fileReader, packages)
  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'))
  }

  debug('Create new directory "%s"', outputPath)
  await mkdir(outputPath, {recursive: true})

  debug('Downloading and extracting repo to %s', outputPath)
  await downloadAndExtractRepo(outputPath, repoInfo, bearerToken)

  debug('Checking if template needs read token')
  const needsReadToken = await Promise.all(
    (packages ?? ['']).map((pkg) => checkIfNeedsApiToken(join(outputPath, pkg), 'read')),
  ).then((results) => results.some(Boolean))
  const needsWriteToken = await Promise.all(
    (packages ?? ['']).map((pkg) => checkIfNeedsApiToken(join(outputPath, pkg), 'write')),
  ).then((results) => results.some(Boolean))

  debug('Applying environment variables')
  const readToken = needsReadToken
    ? await generateSanityApiToken(READ_TOKEN_LABEL, 'read', variables.projectId, apiClient)
    : undefined
  const writeToken = needsWriteToken
    ? await generateSanityApiToken(WRITE_TOKEN_LABEL, 'write', variables.projectId, apiClient)
    : undefined

  for (const pkg of packages ?? ['']) {
    const packagePath = join(outputPath, pkg)
    const packageFramework: Framework | null = await detectFrameworkRecord({
      fs: new LocalFileSystemDetector(packagePath),
      frameworkList: frameworks as readonly Framework[],
    })

    const port = getDefaultPortForFramework(packageFramework?.slug)
    if (corsAdded.includes(port) === false) {
      debug('Setting CORS origin to http://localhost:%d', port)
      await setCorsOrigin(`http://localhost:${port}`, variables.projectId, apiClient)
      corsAdded.push(port)
    }

    debug('Applying environment variables to %s', pkg)
    // Next.js uses `.env.local` for local environment variables
    const envName = packageFramework?.slug === 'nextjs' ? '.env.local' : '.env'
    await applyEnvVariables(packagePath, {...variables, readToken, writeToken}, envName)
  }

  debug('Setting package name to %s', packageName)
  await tryApplyPackageName(outputPath, packageName)

  debug('Initializing git repository')
  tryGitInit(outputPath, INITIAL_COMMIT_MESSAGE)

  debug('Updating initial template metadata')
  await updateInitialTemplateMetadata(apiClient, variables.projectId, `external-${name}`)

  spinner.succeed()
  if (corsAdded.length) {
    output.success(`CORS origins added (${corsAdded.map((p) => `localhost:${p}`).join(', ')})`)
  }
  if (readToken) output.success(`API token generated (${READ_TOKEN_LABEL})`)
  if (writeToken) output.success(`API token generated (${WRITE_TOKEN_LABEL})`)
}
