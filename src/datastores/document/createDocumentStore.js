import Observable from '../utils/SanityStoreObservable'

import {range} from 'lodash'
import createActions from '../utils/createActions'
import pubsubber from '../utils/pubsubber'
import replayer from './replayer'

import client from 'client:@sanity/base/client'

function promiseToObservable(promise) {
  return new Observable(subscriber => {
    promise.then(onSuccess, onError)

    function onSuccess(value) {
      subscriber.next(value)
      complete()
    }

    function onError(error) {
      subscriber.error(error)
      complete()
    }

    function complete() {
      subscriber.complete()
    }
  })
}

const hasOwn = {}.hasOwnProperty
function flattenPatch(patch) {
  return Object.keys(patch).reduce((flattened, key) => {
    const val = patch[key]
    if (hasOwn.call(val, '$set')) {
      return Object.assign(flattened, {[key]: val.$set})
    }
    return flattened
  }, {})
}

function query(q, params) {
  return promiseToObservable(client.fetch(q, params))
    .map(response => ({
      event: 'snapshot',
      documents: response.result
    }))
}

function update(id, patch) {

  const progress = new Observable(observer => {
    observer.next({
      type: 'updating',
      patch: patch
    })

    client.update(id, flattenPatch(patch))
      .then(onSuccess, onError)
      .then(onComplete)

    function onSuccess(response) {
      observer.next({
        type: 'updated',
        docIds: response.docIds
      })
    }

    function onError(error) {
      observer.error(error)
    }

    function onComplete() {
      observer.complete()
    }
  })
  return {progress}
}

function create(doc) {
  const progress = new Observable(observer => {
    observer.next({
      type: 'create',
      status: 'initializing',
      document: doc
    })

    client.create(doc)
      .then(onSuccess, onError)
      .then(onComplete)

    function onSuccess(response) {
      observer.next({
        type: 'created',
        status: 'success',
        transactionId: response.transactionId,
        docIds: response.docIds
      })
    }

    function onError(error) {
      observer.error(error)
    }

    function onComplete() {
      observer.complete()
    }
  })

  return {progress}
}

function getUploadStage(percent) {
  if (percent < 5) {
    return 'initializing'
  }
  if (percent < 60) {
    return 'uploading'
  }
  if (percent < 80) {
    return 'converting'
  }
  if (percent < 95) {
    return 'finishing'
  }
  return 'complete'
}

function upload(file) {

  // todo: this works, but is kind of messy atm. figure out a better way
  const cancelChan = pubsubber()

  const cancellations = new Observable(observer => {
    return cancelChan.subscribe(() => observer.next())
  })

  const cancel = () => cancelChan.publish()

  let snapshot = {
    type: 'progress',
    cancel: cancel,
    stage: 'initializing',
    percent: 0
  }

  const seq = replayer(range(100), {wait: idx => Math.random() * 100}, (n, idx, {last}) => {
    return {
      type: 'progress',
      cancel: cancel,
      stage: getUploadStage(idx),
      percent: n + 1,
      last: last
    }
  })

  seq.subscribe(val => {
    snapshot = val
  })
  seq.start()

  const progress = new Observable(observer => {
    observer.next({event: 'snapshot', snapshot: snapshot})

    cancellations.subscribe(reason => {
      observer.complete({event: 'cancelled', reason})
    })

    if (snapshot.last) {
      observer.complete()
      return () => {
      }
    }
    return seq.subscribe(value => {
      observer.next(value)
      if (value.last) {
        observer.complete()
      }
    })
  })

  return {
    progress,
    cancel
  }
}

export default function createDocumentStore(options = {}) {
  const actions = createActions({
    create: create,
    update: update,
    upload: upload
  })

  const store = {
    actions,
    query
  }
  return store
}
