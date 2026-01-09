import path from 'node:path'

import {runCli} from './cli'
import {getCliPkg} from './util/getCliVersion'

void getCliPkg().then((cliPkg) => {
  return runCli(path.join(__dirname, '..'), {cliPkg})
})
