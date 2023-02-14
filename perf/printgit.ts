import {ALL, getCurrentBranchSync, getGitInfoSync} from './utils/gitUtils'

console.log(getGitInfoSync(ALL))
console.log(getCurrentBranchSync())
