import {runCli} from './cli'
import {getCliPkg} from './util/getCliVersion'
import path from 'node:path'

void getCliPkg().then((cliPkg) => {
  return runCli(path.join(__dirname, '..'), {cliPkg})
})
