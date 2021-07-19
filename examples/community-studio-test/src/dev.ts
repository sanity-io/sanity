import dotenv from 'dotenv'
import {createServer} from 'http'
import {createHandler} from './createHandler'
import {readEnv} from './utils/readEnv'
import {readSecrets} from './utils/readSecrets'

const env = dotenv.config().parsed

const secrets = readSecrets(env)
const port = Number(readEnv(env, 'PORT'))

createServer(createHandler(secrets)).listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log('Development server listening on port %d', port)
})
