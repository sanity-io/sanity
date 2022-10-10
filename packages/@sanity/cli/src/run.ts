import path from 'path'
import {version} from '../package.json'
import {runCli} from './cli'

runCli(path.join(__dirname, '..'), {cliVersion: version})
