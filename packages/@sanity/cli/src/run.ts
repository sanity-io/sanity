import path from 'node:path'

import {runCli} from './cli'
import {getCliPkg} from './util/getCliVersion'

getCliPkg().then((cliPkg) => {
  runCli(path.join(__dirname, '..'), {cliPkg})
})
