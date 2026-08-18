import pMap from 'p-map'

import {REPO} from '../constants'
import {getOctokit} from '../octokit'
import {getReleasePr} from '../utils/getReleasePR'
import {writeCheck} from '../utils/writeCheck'

export async function writePrChecks() {
  const releasePr = await getReleasePr()

  const octokit = getOctokit()
  const prs = await octokit.paginate(octokit.pulls.list, {
    ...REPO,
    per_page: 100,
    state: 'open',
    base: 'main',
  })

  // no need to write check on the release PR itself (if it exists)
  const filteredPrs = releasePr ? prs.filter((pr) => pr.number !== releasePr.number) : prs
  return pMap(
    filteredPrs,
    (pr) => writeCheck({releasePr, headSha: pr.head.sha, currentPrNumber: pr.number}),
    {concurrency: 10},
  )
}
