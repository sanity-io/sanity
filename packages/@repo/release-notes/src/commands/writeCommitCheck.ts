import {getReleasePr} from '../utils/getReleasePR'
import {writeCheck} from '../utils/writeCheck'

export async function writeCommitCheck(options: {commit: string}) {
  return writeCheck({releasePr: await getReleasePr(), headSha: options.commit})
}
