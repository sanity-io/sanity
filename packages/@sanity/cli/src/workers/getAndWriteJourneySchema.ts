import {parentPort, workerData} from 'node:worker_threads'

import {getAndWriteJourneySchema} from '../util/journeyConfig'

getAndWriteJourneySchema(workerData)
  .then(() => parentPort?.postMessage({type: 'success'}))
  .catch((error) => parentPort?.postMessage({type: 'error', error}))
