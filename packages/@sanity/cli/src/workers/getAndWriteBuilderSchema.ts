import {parentPort, workerData} from 'worker_threads'
import {getAndWriteBuilderSchema} from '../util/builderSchema'

getAndWriteBuilderSchema(workerData)
  .then(() => parentPort?.postMessage({type: 'success'}))
  .catch((error) => parentPort?.postMessage({type: 'error', error}))
