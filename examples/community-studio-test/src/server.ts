import http from 'http'
import {createHandler} from './createHandler'
import {readEnv} from './utils/readEnv'
import {readSecrets} from './utils/readSecrets'

const port = Number(readEnv(process.env, 'PORT'))

http.createServer(createHandler(readSecrets(process.env))).listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log('Server listening on port %s', port)
})
