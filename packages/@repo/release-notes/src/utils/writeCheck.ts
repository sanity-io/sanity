import {REPO} from '../constants'
import {getOctokit} from '../octokit'
import {type PullRequest} from '../types'

export const CHECK_NAME = 'Check for in-flight release'
export const EXTERNAL_ID = 'release-pr-status-check'

export async function writeCheck({
  currentPrNumber,
  headSha,
  releasePr,
}: {
  currentPrNumber: number
  releasePr?: PullRequest
  headSha: string
}) {
  const canMerge =
    !releasePr ||
    releasePr.draft ||
    // Release PR should always be mergeable
    releasePr.number === currentPrNumber

  const output = {
    title: canMerge
      ? '✅ There is no in-flight release, merging is OK.'
      : '‼️ Release in progress, merging is blocked.',
    summary: canMerge
      ? releasePr
        ? `✅ The [release PR](${releasePr.html_url}) is still a draft, merging is OK.`
        : `✅ There is no release PR, merging is OK`
      : `⚠️️ The [release PR](${releasePr.html_url}) is marked as ready for review. Please wait for the release to complete before merging.`,
  }

  const octokit = getOctokit()

  // external_id is not server-filterable, so list by name and match client-side
  const {data} = await octokit.checks.listForRef({
    ...REPO,
    ref: headSha,
    check_name: CHECK_NAME,
    per_page: 100,
  })

  const matching = data.check_runs.filter((run) => run.external_id === EXTERNAL_ID)
  // check-run ids are monotonic, so the highest id is the newest run; started_at is null for queued runs
  const latest = matching.reduce<(typeof matching)[number] | undefined>(
    (newest, run) => (!newest || run.id > newest.id ? run : newest),
    undefined,
  )

  if (canMerge) {
    if (latest?.status === 'completed' && latest.conclusion === 'success') {
      return latest
    }
    if (latest && latest.status !== 'completed') {
      // finishing an in-progress run is the reliable lifecycle direction
      return octokit.checks.update({
        ...REPO,
        check_run_id: latest.id,
        status: 'completed',
        conclusion: 'success',
        output,
      })
    }
    return octokit.checks.create({
      ...REPO,
      head_sha: headSha,
      external_id: EXTERNAL_ID,
      name: CHECK_NAME,
      status: 'completed',
      conclusion: 'success',
      output,
    })
  }

  if (latest && latest.status !== 'completed') {
    return latest
  }
  // a completed run cannot be reliably reopened, so block with a fresh run; the newest run wins the gate
  return octokit.checks.create({
    ...REPO,
    head_sha: headSha,
    external_id: EXTERNAL_ID,
    name: CHECK_NAME,
    status: 'in_progress',
    output,
  })
}
