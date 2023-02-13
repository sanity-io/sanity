const getRepoInfo = require('git-repo-info')

console.log(JSON.stringify(getRepoInfo(), null, 2))
