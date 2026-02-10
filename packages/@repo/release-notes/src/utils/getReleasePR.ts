import {REPO} from '../constants'
import {octokit} from '../octokit'

export async function getReleasePr() {
  const {data: releasePrs} = await octokit.pulls.list({
    ...REPO,
    state: 'open',
    head: `${REPO.owner}:ci/release-main`,
    base: 'main',
  })

  if (releasePrs.length > 1) {
    throw new Error('Multiple open release PRs found, something is wrong!')
  }

  return releasePrs[0]
}
