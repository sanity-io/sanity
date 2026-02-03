import {getCliConfig} from '../util/getCliConfig'
import {parentPort, workerData} from 'node:worker_threads'

// We're communicating with a parent process through a message channel
getCliConfig(workerData, {forked: false})
  .then((config) => parentPort?.postMessage({type: 'config', config}))
  .catch((error) =>
    parentPort?.postMessage({
      type: 'error',
      error: error instanceof Error ? error.stack : error,
      errorType: error && (error.type || error.name),
    }),
  )
