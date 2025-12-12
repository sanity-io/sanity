import path from 'node:path'

import {runCli} from './cli.ts'
import {getCliPkg} from './util/getCliVersion.ts'

void getCliPkg().then((cliPkg) => {
  return runCli(path.join(__dirname, '..'), {cliPkg})
})
