import {access, readFile, writeFile} from 'node:fs/promises'
import {join, posix, sep} from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {type ReadableStream} from 'node:stream/web'

import {x} from 'tar'
import {parse as parseYaml} from 'yaml'

import {type CliApiClient, type PackageJson} from '../types'

const ENV_VAR = {
  PROJECT_ID: /SANITY(?:_STUDIO)?_PROJECT_ID/, // Matches SANITY_PROJECT_ID and SANITY_STUDIO_PROJECT_ID
  DATASET: /SANITY(?:_STUDIO)?_DATASET/, // Matches SANITY_DATASET and SANITY_STUDIO_DATASET
  READ_TOKEN: 'SANITY_API_READ_TOKEN',
  API_VERSION: /SANITY(?:_STUDIO)?_API_VERSION/, // Matches SANITY_API_VERSION and SANITY_STUDIO_API_VERSION
} as const

const ENV_FILE = {
  TEMPLATE: '.env.template',
  EXAMPLE: '.env.example',
  LOCAL_EXAMPLE: '.env.local.example',
} as const

const ENV_TEMPLATE_FILES = [ENV_FILE.TEMPLATE, ENV_FILE.EXAMPLE, ENV_FILE.LOCAL_EXAMPLE] as const

type EnvData = {
  projectId: string
  dataset: string
  readToken?: string
  apiVersion?: string
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

function isGithubRepoShorthand(value: string): boolean {
  if (URL.canParse(value)) {
    return false
  }
  // This supports :owner/:repo and :owner/:repo/nested/path, e.g.
  // sanity-io/sanity
  // sanity-io/sanity/templates/next-js
  // sanity-io/templates/live-content-api
  return /^[\w-]+\/[\w-.]+(\/[\w-.]+)*$/.test(value)
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
        throw new Error(
          'GitHub repository not found. For private repositories, use --template-token to provide an access token',
        )
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
    throw new Error(
      'GitHub repository not found. For private repositories, use --template-token to provide an access token',
    )
  }
}

export async function downloadAndExtractRepo(
  root: string,
  {username, name, branch, filePath}: RepoInfo,
  bearerToken?: string,
) {
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
        return posixPath.startsWith(`${rootPath}${filePath ? `/${filePath}/` : '/'}`)
      },
    }),
  )
}

/**
 * Checks if a GitHub repository is a monorepo by examining common monorepo configuration files.
 * Supports pnpm workspaces, Lerna, Rush, and npm workspaces (package.json).
 * @returns Promise that resolves to an array of package paths/names if monorepo is detected, undefined otherwise
 */
export async function getMonoRepo(
  repoInfo: RepoInfo,
  bearerToken?: string,
): Promise<string[] | undefined> {
  const {username, name, branch, filePath} = repoInfo
  const baseUrl = `https://raw.githubusercontent.com/${username}/${name}/${branch}/${filePath}`

  const headers: Record<string, string> = {}
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  type MonorepoHandler = {
    check: (content: string) => string[] | undefined
  }

  const handlers: Record<string, MonorepoHandler> = {
    'package.json': {
      check: (content) => {
        try {
          const pkg = JSON.parse(content)
          if (!pkg.workspaces) return undefined
          return Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages
        } catch {
          return undefined
        }
      },
    },
    'pnpm-workspace.yaml': {
      check: (content) => {
        try {
          const config = parseYaml(content)
          return config.packages
        } catch {
          return undefined
        }
      },
    },
    'lerna.json': {
      check: (content) => {
        try {
          const config = JSON.parse(content)
          return config.packages
        } catch {
          return undefined
        }
      },
    },
    'rush.json': {
      check: (content) => {
        try {
          const config = JSON.parse(content)
          return config.projects?.map((p: {packageName: string}) => p.packageName)
        } catch {
          return undefined
        }
      },
    },
  }

  const fileChecks = await Promise.all(
    Object.keys(handlers).map(async (file) => {
      const response = await fetch(`${baseUrl}/${file}`, {headers})
      return {file, exists: response.status === 200, content: await response.text()}
    }),
  )

  for (const check of fileChecks) {
    if (!check.exists) continue
    const result = handlers[check.file].check(check.content)
    if (result) return result
  }

  return undefined
}

/**
 * Validates a single package within a repository against required criteria.
 */
async function validatePackage(
  baseUrl: string,
  packagePath: string,
  headers: Record<string, string>,
  isRoot: boolean,
): Promise<{
  hasSanityConfig: boolean
  hasSanityCli: boolean
  hasEnvFile: boolean
  hasSanityDep: boolean
}> {
  const packageUrl = packagePath ? `${baseUrl}/${packagePath}` : baseUrl

  const requiredFiles = [
    'package.json',
    'sanity.config.ts',
    'sanity.config.js',
    'sanity.cli.ts',
    'sanity.cli.js',
    ...ENV_TEMPLATE_FILES,
  ]

  const fileChecks = await Promise.all(
    requiredFiles.map(async (file) => {
      const response = await fetch(`${packageUrl}/${file}`, {headers})
      return {file, exists: response.status === 200, content: await response.text()}
    }),
  )

  const packageJson = fileChecks.find((f) => f.file === 'package.json')
  if (!packageJson?.exists) {
    throw new Error(`Package at ${packagePath || 'root'} must include a package.json file`)
  }

  let hasSanityDep = false
  try {
    const pkg: PackageJson = JSON.parse(packageJson.content)
    hasSanityDep = !!(pkg.dependencies?.sanity || pkg.devDependencies?.sanity)
  } catch (err) {
    throw new Error(`Invalid package.json file in ${packagePath || 'root'}`)
  }

  const hasSanityConfig = fileChecks.some(
    (f) => f.exists && (f.file === 'sanity.config.ts' || f.file === 'sanity.config.js'),
  )

  const hasSanityCli = fileChecks.some(
    (f) => f.exists && (f.file === 'sanity.cli.ts' || f.file === 'sanity.cli.js'),
  )

  const envFile = fileChecks.find(
    (f) => f.exists && ENV_TEMPLATE_FILES.includes(f.file as (typeof ENV_TEMPLATE_FILES)[number]),
  )
  if (envFile) {
    const envContent = envFile.content
    const hasProjectId = envContent.match(ENV_VAR.PROJECT_ID)
    const hasDataset = envContent.match(ENV_VAR.DATASET)

    if (!hasProjectId || !hasDataset) {
      const missing = []
      if (!hasProjectId) missing.push('SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID')
      if (!hasDataset) missing.push('SANITY_DATASET or SANITY_STUDIO_DATASET')
      throw new Error(
        `Environment template in ${
          packagePath || 'repo'
        } must include the following variables: ${missing.join(', ')}`,
      )
    }
  }

  return {
    hasSanityConfig,
    hasSanityCli,
    hasEnvFile: Boolean(envFile),
    hasSanityDep,
  }
}

/**
 * Validates a GitHub repository template against required criteria.
 * Supports both monorepo and single-package repositories.
 *
 * For monorepos:
 * - Each package must have a valid package.json
 * - At least one package must include 'sanity' in dependencies or devDependencies
 * - At least one package must have sanity.config.js/ts and sanity.cli.js/ts
 * - Each package must have a .env.template, .env.example, or .env.local.example
 *
 * For single-package repositories:
 * - Must have a valid package.json with 'sanity' dependency
 * - Must have sanity.config.js/ts and sanity.cli.js/ts
 * - Must have .env.template, .env.example, or .env.local.example
 *
 * Environment files must include:
 * - SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID variable
 * - SANITY_DATASET or SANITY_STUDIO_DATASET variable
 *
 * @throws Error if validation fails with specific reason
 */
export async function validateRemoteTemplate(
  repoInfo: RepoInfo,
  packages: string[] = [''],
  bearerToken?: string,
): Promise<void> {
  const {username, name, branch, filePath} = repoInfo
  const baseUrl = `https://raw.githubusercontent.com/${username}/${name}/${branch}/${filePath}`

  const headers: Record<string, string> = {}
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  const validations = await Promise.all(
    packages.map((pkg) => validatePackage(baseUrl, pkg, headers, pkg === '')),
  )

  const hasSanityDep = validations.some((v) => v.hasSanityDep)
  if (!hasSanityDep) {
    throw new Error('At least one package must include "sanity" as a dependency in package.json')
  }

  const hasSanityConfig = validations.some((v) => v.hasSanityConfig)
  if (!hasSanityConfig) {
    throw new Error('At least one package must include a sanity.config.js or sanity.config.ts file')
  }

  const hasSanityCli = validations.some((v) => v.hasSanityCli)
  if (!hasSanityCli) {
    throw new Error('At least one package must include a sanity.cli.js or sanity.cli.ts file')
  }

  const missingEnvPackages = packages.filter((pkg, i) => !validations[i].hasEnvFile)
  if (missingEnvPackages.length > 0) {
    throw new Error(
      `The following packages are missing .env.template, .env.example, or .env.local.example files: ${missingEnvPackages.join(
        ', ',
      )}`,
    )
  }
}

export async function isNextJsTemplate(root: string): Promise<boolean> {
  try {
    const packageJson = await readFile(join(root, 'package.json'), 'utf8')
    const pkg = JSON.parse(packageJson)
    return !!(pkg.dependencies?.next || pkg.devDependencies?.next)
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
  ).catch(() => {
    throw new Error('Could not find .env.template, .env.example or .env.local.example file')
  })

  try {
    const templateContent = await readFile(join(root, templatePath), 'utf8')
    const {projectId, dataset, readToken = '', apiVersion = 'vX'} = envData

    const findAndReplaceVariable = (
      content: string,
      varRegex: RegExp | string,
      value: string,
      useQuotes: boolean,
    ) => {
      const pattern = varRegex instanceof RegExp ? varRegex : new RegExp(`${varRegex}=.*$`, 'm')
      const match = content.match(pattern)
      if (!match) return content

      const varName = match[0].split('=')[0]
      return content.replace(
        new RegExp(`${varName}=.*$`, 'm'),
        `${varName}=${useQuotes ? `"${value}"` : value}`,
      )
    }

    let envContent = templateContent
    const vars = [
      {pattern: ENV_VAR.PROJECT_ID, value: projectId},
      {pattern: ENV_VAR.DATASET, value: dataset},
      {pattern: ENV_VAR.READ_TOKEN, value: readToken},
      {pattern: ENV_VAR.API_VERSION, value: apiVersion},
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

export async function generateSanityApiReadToken(
  projectId: string,
  apiClient: CliApiClient,
): Promise<string> {
  const response = await apiClient({requireProject: false, requireUser: true})
    .config({apiVersion: 'v2021-06-07'})
    .request<{key: string}>({
      uri: `/projects/${projectId}/tokens`,
      method: 'POST',
      body: {
        label: `API Read Token (${Date.now()})`,
        roleName: 'viewer',
      },
    })
  return response.key
}
