import {getOctokit} from '../octokit'

export async function getMergedPRForCommit(owner: string, repo: string, commitSha: string) {
  // Get PRs associated with the commit
  // see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
  const {data: prs} = await getOctokit().repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    // eslint-disable-next-line camelcase
    commit_sha: commitSha,
  })

  // Find the merged PR (if any)
  return prs.find((pr) => pr.merged_at !== null)
}
