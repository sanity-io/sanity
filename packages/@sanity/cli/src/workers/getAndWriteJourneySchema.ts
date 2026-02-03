import {getAndWriteJourneySchema} from '../util/journeyConfig'
import {parentPort, workerData} from 'node:worker_threads'

getAndWriteJourneySchema(workerData)
  .then(() => parentPort?.postMessage({type: 'success'}))
  .catch((error) => parentPort?.postMessage({type: 'error', error}))
