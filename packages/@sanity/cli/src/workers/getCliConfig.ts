import {parentPort, workerData} from 'worker_threads'
import {getCliConfig} from '../util/getCliConfig'

// We're communicating with a parent process through a message channel
getCliConfig(workerData, {forked: false})
  .then((config) => parentPort?.postMessage({type: 'config', config}))
  .catch(
    (error) =>
      parentPort?.postMessage({
        type: 'error',
        error: error instanceof Error ? error.stack : error,
        errorType: error && (error.type || error.name),
      }),
  )
