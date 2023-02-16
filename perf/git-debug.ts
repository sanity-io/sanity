import {ALL_FIELDS, getCurrentBranch, getCurrentBranchSync, getGitInfoSync} from './utils/gitUtils'
import {getEnv} from './utils/env'

console.log('ENV:', getEnv('CURRENT_BRANCH', true))
console.log('git says: ', getCurrentBranchSync())
getCurrentBranch().then(console.log)
console.log(getGitInfoSync(ALL_FIELDS))
console.log('------------------')
