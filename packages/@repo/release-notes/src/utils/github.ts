import {getOctokit} from '../octokit'
import {type CommitAuthor, type PullRequest} from '../types'

/**
 * GitHub appends the PR number to the commit subject when squash-merging,
 * e.g. `fix(core): something (#12345)`.
 */
export function getPrNumberFromSubject(subject: string | undefined): number | undefined {
  const match = subject?.match(/\(#(\d+)\)\s*$/)
  return match ? Number(match[1]) : undefined
}

export async function getMergedPRForCommit(
  owner: string,
  repo: string,
  commitSha: string,
  subject?: string,
): Promise<PullRequest | undefined> {
  // Get PRs associated with the commit
  // see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
  const {data: prs} = await getOctokit().repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: commitSha,
  })

  const mergedPrs = prs.filter((pr) => pr.merged_at !== null)

  // A commit can be associated with several PRs, e.g. when it was merged into
  // another branch through its own PR and later landed on main through a
  // branch-integration PR. Trust the PR number GitHub put in the commit
  // subject over the association list, so commits aren't attributed to the
  // integration PR (and its author).
  const subjectPrNumber = getPrNumberFromSubject(subject)
  if (subjectPrNumber) {
    const subjectPr = mergedPrs.find((pr) => pr.number === subjectPrNumber)
    if (subjectPr) {
      return subjectPr
    }
    // A rebase-merge rewrites commit SHAs, so the original PR may no longer be
    // associated with the commit on main — fetch it directly instead.
    const originalPr = await getOctokit()
      .pulls.get({
        owner,
        repo,
        pull_number: subjectPrNumber,
      })
      .then(
        (response) => response.data,
        () => undefined,
      )
    if (originalPr?.merged_at) {
      return originalPr
    }
  }

  return mergedPrs[0]
}

/**
 * Returns the GitHub user matching the commit's git author, if any. Unlike the
 * user of the PR that landed the commit on main, this stays correct when
 * someone else's commits are merged through a rebase- or branch-integration PR.
 */
export async function getCommitAuthor(
  owner: string,
  repo: string,
  commitSha: string,
): Promise<CommitAuthor | undefined> {
  const {data} = await getOctokit().repos.getCommit({owner, repo, ref: commitSha})
  return data.author ?? undefined
}
