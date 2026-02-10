import {getReleasePr} from '../utils/getReleasePR'
import {writeCheck} from '../utils/writeCheck'

export async function writeCommitCheck(options: {commit: string; currentPrNumber: number}) {
  return writeCheck({
    currentPrNumber: options.currentPrNumber,
    releasePr: await getReleasePr(),
    headSha: options.commit,
  })
}
