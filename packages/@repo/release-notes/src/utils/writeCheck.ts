import {REPO} from '../constants'
import {octokit} from '../octokit'
import {type PullRequest} from '../types'

export function writeCheck({
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

  return octokit.checks.create({
    ...REPO,
    // eslint-disable-next-line camelcase
    external_id: 'release-pr-status-check',
    name: 'Check for in-flight release',
    // eslint-disable-next-line camelcase
    head_sha: headSha,
    status: canMerge ? 'completed' : 'in_progress',
    ...(canMerge ? {conclusion: 'success'} : {}),
    output: {
      title: canMerge
        ? '✅ There is no in-flight release, merging is OK.'
        : '‼️ Release in progress, merging is blocked.',
      summary: canMerge
        ? releasePr
          ? `✅ The [release PR](${releasePr.html_url}) is still a draft, merging is OK.`
          : `✅ There is no release PR, merging is OK`
        : `⚠️️ The [release PR](${releasePr.html_url}) is marked as ready for review. Please wait for the release to complete before merging.`,
    },
  })
}
