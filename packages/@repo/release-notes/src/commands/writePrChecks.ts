import {REPO} from '../constants'
import {octokit} from '../octokit'
import {getReleasePr} from '../utils/getReleasePR'
import {writeCheck} from '../utils/writeCheck'
import pMap from 'p-map'

export async function writePrChecks() {
  const releasePr = await getReleasePr()

  // get the 100 most recently updated PRs
  const {data: prs} = await octokit.pulls.list({
    ...REPO,
    // eslint-disable-next-line camelcase
    per_page: 100,
    state: 'open',
    sort: 'updated',
    directory: 'desc',
    base: 'main',
  })

  return pMap(
    prs.filter((pr) => pr.number !== releasePr.number),
    (pr) => writeCheck({releasePr, headSha: pr.head.sha, currentPrNumber: pr.number}),
    {concurrency: 10},
  )
}
