import path from 'node:path'

import {runCli} from './cli'
import {getCliVersion} from './util/getCliVersion'

getCliVersion().then((cliVersion) => {
  runCli(path.join(__dirname, '..'), {cliVersion})
})
