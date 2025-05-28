import {access, readFile, writeFile} from 'node:fs/promises'
import {join, posix, sep} from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {type ReadableStream} from 'node:stream/web'

import {ENV_TEMPLATE_FILES, REQUIRED_ENV_VAR} from '@sanity/template-validator'
import {x} from 'tar'

import {debug} from '../debug'
import {type CliApiClient, type PackageJson} from '../types'

const DISALLOWED_PATHS = [
  // Prevent security risks from unknown GitHub Actions
  '/.github/',
]

const ENV_VAR = {
  ...REQUIRED_ENV_VAR,
  READ_TOKEN: 'SANITY_API_READ_TOKEN',
  WRITE_TOKEN: 'SANITY_API_WRITE_TOKEN',
} as const

const API_READ_TOKEN_ROLE = 'viewer'
const API_WRITE_TOKEN_ROLE = 'editor'

type EnvData = {
  projectId: string
  dataset: string
  readToken?: string
  writeToken?: string
}

type GithubUrlString =
  | `https://github.com/${string}/${string}`
  | `https://www.github.com/${string}/${string}`

export type RepoInfo = {
  username: string
  name: string
  branch: string
  filePath: string
}

export function getGitHubRawContentUrl(repoInfo: RepoInfo): string {
  const {username, name, branch, filePath} = repoInfo
  return `https://raw.githubusercontent.com/${username}/${name}/${branch}/${filePath}`
}

function isGithubRepoShorthand(value: string): boolean {
  if (URL.canParse(value)) {
    return false
  }
  // This supports :owner/:repo and :owner/:repo/nested/path, e.g.
  // sanity-io/sanity
  // sanity-io/sanity/templates/next-js
  // sanity-io/templates/live-content-api
  // sanity-io/sanity/packages/@sanity/cli/test/test-template
  return /^[\w-]+\/[\w-.]+(\/[@\w-.]+)*$/.test(value)
}

function isGithubRepoUrl(value: string | URL): value is URL | GithubUrlString {
  if (URL.canParse(value) === false) {
    return false
  }
  const url = new URL(value)
  const pathSegments = url.pathname.slice(1).split('/')

  return (
    url.protocol === 'https:' &&
    url.hostname === 'github.com' &&
    // The pathname must have at least 2 segments. If it has more than 2, the
    // third must be "tree" and it must have at least 4 segments.
    // https://github.com/:owner/:repo
    // https://github.com/:owner/:repo/tree/:ref
    pathSegments.length >= 2 &&
    (pathSegments.length > 2 ? pathSegments[2] === 'tree' && pathSegments.length >= 4 : true)
  )
}

async function downloadTarStream(url: string, bearerToken?: string): Promise<Readable> {
  const headers: Record<string, string> = {}
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  const res = await fetch(url, {headers})

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`)
  }

  return Readable.fromWeb(res.body as ReadableStream)
}

export function checkIsRemoteTemplate(templateName?: string): boolean {
  return templateName?.includes('/') ?? false
}

export async function getGitHubRepoInfo(value: string, bearerToken?: string): Promise<RepoInfo> {
  let username = ''
  let name = ''
  let branch = ''
  let filePath = ''

  if (isGithubRepoShorthand(value)) {
    const parts = value.split('/')
    username = parts[0]
    name = parts[1]
    // If there are more segments after owner/repo, they form the file path
    if (parts.length > 2) {
      filePath = parts.slice(2).join('/')
    }
  }

  if (isGithubRepoUrl(value)) {
    const url = new URL(value)
    const pathSegments = url.pathname.slice(1).split('/')
    username = pathSegments[0]
    name = pathSegments[1]

    // If we have a "tree" segment, everything after branch is the file path
    if (pathSegments[2] === 'tree') {
      branch = pathSegments[3]
      if (pathSegments.length > 4) {
        filePath = pathSegments.slice(4).join('/')
      }
    }
  }

  if (!username || !name) {
    throw new Error('Invalid GitHub repository format')
  }

  const tokenMessage =
    'GitHub repository not found. For private repositories, use --template-token to provide an access token.\n\n' +
    'You can generate a new token at https://github.com/settings/personal-access-tokens/new\n' +
    'Set the token to "read-only" with repository access and a short expiry (e.g. 7 days) for security.'

  try {
    const headers: Record<string, string> = {}
    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`
    }

    const infoResponse = await fetch(`https://api.github.com/repos/${username}/${name}`, {
      headers,
    })

    if (infoResponse.status !== 200) {
      if (infoResponse.status === 404) {
        throw new Error(tokenMessage)
      }
      throw new Error('GitHub repository not found')
    }

    const info = await infoResponse.json()

    return {
      username,
      name,
      branch: branch || info.default_branch,
      filePath,
    }
  } catch {
    throw new Error(tokenMessage)
  }
}

export async function downloadAndExtractRepo(
  root: string,
  {username, name, branch, filePath}: RepoInfo,
  bearerToken?: string,
): Promise<void> {
  let rootPath: string | null = null
  await pipeline(
    await downloadTarStream(
      `https://codeload.github.com/${username}/${name}/tar.gz/${branch}`,
      bearerToken,
    ),
    x({
      cwd: root,
      strip: filePath ? filePath.split('/').length + 1 : 1,
      filter: (p: string) => {
        const posixPath = p.split(sep).join(posix.sep)
        if (rootPath === null) {
          const pathSegments = posixPath.split(posix.sep)
          rootPath = pathSegments.length ? pathSegments[0] : null
        }
        for (const disallowedPath of DISALLOWED_PATHS) {
          if (posixPath.includes(disallowedPath)) return false
        }
        return posixPath.startsWith(`${rootPath}${filePath ? `/${filePath}/` : '/'}`)
      },
    }),
  )
}

export async function checkIfNeedsApiToken(root: string, type: 'read' | 'write'): Promise<boolean> {
  try {
    const templatePath = await Promise.any(
      ENV_TEMPLATE_FILES.map(async (file) => {
        await access(join(root, file))
        return file
      }),
    )
    const templateContent = await readFile(join(root, templatePath), 'utf8')
    return templateContent.includes(type === 'read' ? ENV_VAR.READ_TOKEN : ENV_VAR.WRITE_TOKEN)
  } catch {
    return false
  }
}

export async function applyEnvVariables(
  root: string,
  envData: EnvData,
  targetName = '.env',
): Promise<void> {
  const templatePath = await Promise.any(
    ENV_TEMPLATE_FILES.map(async (file) => {
      await access(join(root, file))
      return file
    }),
  ).catch(() => undefined)

  if (!templatePath) {
    return // No template .env file found, skip
  }

  try {
    const templateContent = await readFile(join(root, templatePath), 'utf8')
    const {projectId, dataset, readToken = '', writeToken = ''} = envData

    const findAndReplaceVariable = (
      content: string,
      varRegex: RegExp | string,
      value: string,
      useQuotes: boolean,
    ) => {
      const varPattern = typeof varRegex === 'string' ? varRegex : varRegex.source
      const pattern = new RegExp(`.*${varPattern}=.*$`, 'gm')
      const matches = content.matchAll(pattern)
      return Array.from(matches).reduce((updatedContent, match) => {
        if (!match[0]) return updatedContent
        const varName = match[0].split('=')[0].trim()
        return updatedContent.replace(
          new RegExp(`${varName}=.*$`, 'gm'),
          `${varName}=${useQuotes ? `"${value}"` : value}`,
        )
      }, content)
    }

    let envContent = templateContent
    const vars = [
      {pattern: ENV_VAR.PROJECT_ID, value: projectId},
      {pattern: ENV_VAR.DATASET, value: dataset},
      {pattern: ENV_VAR.READ_TOKEN, value: readToken},
      {pattern: ENV_VAR.WRITE_TOKEN, value: writeToken},
    ]
    const useQuotes = templateContent.includes('="')

    for (const {pattern, value} of vars) {
      envContent = findAndReplaceVariable(envContent, pattern, value, useQuotes)
    }

    await writeFile(join(root, targetName), envContent)
  } catch (err) {
    throw new Error(
      'Failed to set environment variables. This could be due to file permissions or the .env file format. See https://www.sanity.io/docs/environment-variables for details on environment variable setup.',
    )
  }
}

export async function tryApplyPackageName(root: string, name: string): Promise<void> {
  try {
    const packageJson = await readFile(join(root, 'package.json'), 'utf8')
    const pkg: PackageJson = JSON.parse(packageJson)
    pkg.name = name

    await writeFile(join(root, 'package.json'), JSON.stringify(pkg, null, 2))
  } catch (err) {
    // noop
  }
}

export async function generateSanityApiToken(
  label: string,
  type: 'read' | 'write',
  projectId: string,
  apiClient: CliApiClient,
): Promise<string> {
  const response = await apiClient({requireProject: false, requireUser: true})
    .config({apiVersion: 'v2021-06-07'})
    .request<{key: string}>({
      uri: `/projects/${projectId}/tokens`,
      method: 'POST',
      body: {
        label: `${label} (${Date.now()})`,
        roleName: type === 'read' ? API_READ_TOKEN_ROLE : API_WRITE_TOKEN_ROLE,
      },
    })
  return response.key
}

export async function setCorsOrigin(
  origin: string,
  projectId: string,
  apiClient: CliApiClient,
): Promise<void> {
  try {
    await apiClient({api: {projectId}}).request({
      method: 'POST',
      url: '/cors',
      body: {origin: origin, allowCredentials: true}, // allowCredentials is true to allow for embedded studios if needed
    })
  } catch (error) {
    // Silent fail, it most likely means that the origin is already set
    debug('Failed to set CORS origin', error)
  }
}
