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

export const AGENT_NAMES = ['squiggler', 'triager'] as const

export interface TriageMiriadClient {
  ensureChannel(name: string): Promise<MiriadChannel>
  addAgent(channelId: string, name: string): Promise<unknown>
  sendMessage(channelId: string, content: string): Promise<void>
}

export type TriageResult = CliResult

export interface RunTriageOptions {
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
      }) => TriageMiriadClient)
    | undefined
  log?: ((msg: string) => void) | undefined
}

function helpText(): string {
  return `trigger-triage - kick off the Miriad triage workflow for a GitHub issue

Usage:
  trigger-triage <github-issue-url>
  trigger-triage --dry-run <github-issue-url>
  trigger-triage --verbose <github-issue-url>
  trigger-triage --help

Environment:
  MIRIAD_URL        Miriad REST API base URL (required, unless --dry-run)
  MIRIAD_TOKEN      Miriad bearer token (required, unless --dry-run)
  MIRIAD_SPACE_ID   Miriad space short id (required, unless --dry-run)
  GITHUB_TOKEN      Optional for local runs; GitHub Actions uses github.token

Agents:
  ${AGENT_NAMES.join(', ')} (hardcoded in src/index.ts)

Examples:
  trigger-triage https://github.com/sanity-io/plugins/issues/725
  trigger-triage --dry-run https://github.com/sanity-io/plugins/issues/725
`
}

export async function runTriage(opts: RunTriageOptions): Promise<TriageResult> {
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
  log(`parsed: owner=${owner} repo=${repo} issue=${issueNumber}`)

  const channelName = channelNameFor(repo, issueNumber)
  const issue = await fetchIssue({
    owner,
    repo,
    issueNumber,
    token: env.GITHUB_TOKEN,
    log,
  })

  log(`fetched issue: "${issue.title}" by @${issue.user.login} (${issue.state})`)

  const filter = shouldIgnore(issue)
  if (filter.ignore) {
    stdout.push(`ignored: ${filter.reason}\n`)
    return {stdout, stderr, exitCode: 0}
  }

  if (issue.state === 'closed') {
    stderr.push('warning: issue is closed - proceeding because needs-triage can be intentional\n')
  }

  const kickoff = composeKickoff(owner, repo, issue)

  if (args.dryRun) {
    stdout.push('DRY RUN\n')
    stdout.push(`channel: ${channelName}\n`)
    stdout.push('--- kickoff message ---\n')
    stdout.push(`${kickoff}\n`)
    stdout.push('--- end ---\n')
    stdout.push('dry-run complete (no Miriad REST call made)\n')
    return {stdout, stderr, exitCode: 0}
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const miriadEnv = resolveMiriadEnv(env as MiriadEnvSource)
  const createMiriadClient =
    opts.createMiriadClient ?? ((clientOpts) => new MiriadRestClient(clientOpts))
  const client = createMiriadClient({
    url: miriadEnv.url,
    token: miriadEnv.token,
    spaceId: miriadEnv.spaceId,
    log,
  })
  const channel = await client.ensureChannel(channelName)

  await Promise.all(AGENT_NAMES.map((agentName) => client.addAgent(channel.id, agentName)))
  await client.sendMessage(channel.id, kickoff)

  stdout.push(`Triggered triage for ${owner}/${repo}#${issue.number} - channel: ${channelName}\n`)
  return {stdout, stderr, exitCode: 0}
}

async function main(): Promise<void> {
  try {
    const result = await runTriage({
      argv: process.argv.slice(2),
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      env: process.env as MiriadEnvSource,
      loadEnv: loadLocalEnv,
    })

    writeResult(result)
    if (result.exitCode !== 0) process.exit(result.exitCode)
  } catch (err) {
    die(errorMessage(err))
  }
}

function composeKickoff(owner: string, repo: string, issue: GitHubIssue): string {
  const labelNames = issue.labels.map((label) => label.name)
  const labelStr = labelNames.length > 0 ? labelNames.join(', ') : 'none'

  return [
    `@triager New issue in ${owner}/${repo}:`,
    '',
    `**#${issue.number} - ${issue.title}**`,
    '',
    '|  |  |',
    '| --- | --- |',
    `| Author | @${issue.user.login} |`,
    `| Labels | ${labelStr} |`,
    `| URL | ${issue.html_url} |`,
    '',
    'Please read the issue and all of its comments in full before forming a verdict.',
    'Follow the workflow in your SKILL.md end to end.',
  ].join('\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    die(errorMessage(err))
  })
}
