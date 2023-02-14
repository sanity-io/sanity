import {getCurrentBranch, getCurrentBranchSync} from './utils/gitUtils'
import {getEnv} from './utils/env'

console.log('ENV:', getEnv('CURRENT_BRANCH', true) || getCurrentBranchSync())
getCurrentBranch().then(console.log)
console.log('------------------')
