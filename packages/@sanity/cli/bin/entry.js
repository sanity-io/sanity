const path = require('path')
const {runCli} = require('../lib/cli')
const cliVersion = require('../package.json').version

runCli(path.join(__dirname, '..'), {cliVersion})
