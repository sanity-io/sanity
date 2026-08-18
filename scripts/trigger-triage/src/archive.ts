import {pathToFileURL} from 'node:url'

import {createLog, die, errorMessage, parseArgs, writeResult, type CliResult} from './cli'
import {type MiriadEnvSource, loadLocalEnv, resolveMiriadEnv} from './env'
import {
  fetchIssue as fetchGitHubIssue,
  parseIssueUrl,
  type FetchIssueOptions,
  type GitHubIssue,
} from './github'
import {channelNameFor} from './issue-channel'
import {shouldIgnore} from './issue-filter'
import {type MiriadChannel, MiriadRestClient} from './miriad-rest'

export interface ArchiveMiriadClient {
  findChannelByName(name: string): Promise<MiriadChannel | null>
  archiveChannel(channelId: string): Promise<MiriadChannel>
}

export interface RunArchiveOptions {
  issueUrl?: string | undefined
  argv?: string[] | undefined
  dryRun?: boolean | undefined
  verbose?: boolean | undefined
  env?: (MiriadEnvSource & {GITHUB_TOKEN?: string | undefined}) | undefined
  loadEnv?: ((log: (msg: string) => void) => void) | undefined
  fetchIssue?: ((opts: FetchIssueOptions) => Promise<GitHubIssue>) | undefined
  createMiriadClient?:
    | ((opts: {
        url: string
        token: string
        spaceId: string
        log: (msg: string) => void
      }) => ArchiveMiriadClient)
    | undefined
  log?: ((msg: string) => void) | undefined
}

function helpText(): string {
  return `archive-triage-channel - archive the Miriad channel for a GitHub issue

Usage:
  archive-triage-channel <github-issue-url>
  archive-triage-channel --dry-run <github-issue-url>
  archive-triage-channel --verbose <github-issue-url>
  archive-triage-channel --help

Environment:
  MIRIAD_URL        Miriad REST API base URL (required, unless --dry-run)
  MIRIAD_TOKEN      Miriad bearer token (required, unless --dry-run)
  MIRIAD_SPACE_ID   Miriad space short id (required, unless --dry-run)

Examples:
  archive-triage-channel https://github.com/sanity-io/plugins/issues/660
  archive-triage-channel --dry-run https://github.com/sanity-io/plugins/issues/660
`
}

export async function runArchive(opts: RunArchiveOptions): Promise<CliResult> {
  const stdout: string[] = []
  const stderr: string[] = []
  const args = opts.argv
    ? parseArgs(opts.argv)
    : {
        url: opts.issueUrl ?? null,
        dryRun: opts.dryRun ?? false,
        verbose: opts.verbose ?? false,
        help: false,
      }
  const env = opts.env ?? process.env

  if (args.help) {
    stdout.push(helpText())
    return {stdout, stderr, exitCode: 0}
  }

  if (!args.url) {
    stdout.push(helpText())
    stderr.push('error: missing <github-issue-url>\n')
    return {stdout, stderr, exitCode: 1}
  }

  const log = opts.log ?? createLog(args, stderr)
  opts.loadEnv?.(log)
  const fetchIssue = opts.fetchIssue ?? fetchGitHubIssue

  const {owner, repo, issueNumber} = parseIssueUrl(args.url)
  const channelName = channelNameFor(repo, issueNumber)
  log(`parsed: owner=${owner} repo=${repo} issue=${issueNumber}`)
  log(`channel: ${channelName}`)

  const issue = await fetchIssue({
    owner,
    repo,
    issueNumber,
    token: env.GITHUB_TOKEN,
    log,
  })

  const filter = shouldIgnore(issue)
  if (filter.ignore) {
    stdout.push(`ignored: ${filter.reason}\n`)
    return {stdout, stderr, exitCode: 0}
  }

  if (args.dryRun) {
    stdout.push('DRY RUN\n')
    stdout.push(`channel: ${channelName}\n`)
    stdout.push('dry-run complete (no Miriad archive call made)\n')
    return {stdout, stderr, exitCode: 0}
  }

  const miriadEnv = resolveMiriadEnv(env as MiriadEnvSource)
  const createMiriadClient =
    opts.createMiriadClient ?? ((clientOpts) => new MiriadRestClient(clientOpts))
  const client = createMiriadClient({
    url: miriadEnv.url,
    token: miriadEnv.token,
    spaceId: miriadEnv.spaceId,
    log,
  })

  const channel = await client.findChannelByName(channelName)
  if (!channel) {
    stdout.push(
      `No active Miriad channel found for ${owner}/${repo}#${issueNumber}; it may already be archived\n`,
    )
    return {stdout, stderr, exitCode: 0}
  }

  await client.archiveChannel(channel.id)
  stdout.push(`Archived Miriad channel for ${owner}/${repo}#${issueNumber}: ${channelName}\n`)
  return {stdout, stderr, exitCode: 0}
}

async function main(): Promise<void> {
  try {
    const result = await runArchive({
      argv: process.argv.slice(2),
      env: process.env as MiriadEnvSource,
      loadEnv: loadLocalEnv,
    })

    writeResult(result)
    if (result.exitCode !== 0) process.exit(result.exitCode)
  } catch (err) {
    die(errorMessage(err))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    die(errorMessage(err))
  })
}
