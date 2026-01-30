import pMap from 'p-map'

import {REPO} from '../constants'
import {octokit} from '../octokit'
import {getReleasePr} from '../utils/getReleasePR'
import {writeCheck} from '../utils/writeCheck'

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

  return pMap(prs, (pr) => writeCheck({releasePr, headSha: pr.head.sha}), {concurrency: 10})
}
