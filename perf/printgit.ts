import {ALL, getCurrentBranchSync, getGitInfoSync} from './utils/getGitInfo'

console.log(getGitInfoSync(ALL))
console.log(getCurrentBranchSync())
