import Observable from '../utils/SanityStoreObservable'
import createActions from '../utils/createActions'
import pubsubber from '../utils/pubsubber'
import installationFetcher from 'machine:@sanity/base/installation-fetcher'
import config from 'config:sanity'

function AccessDeniedError(message) {
  this.name = 'AccessDeniedError'
  this.message = (message || '')
}
AccessDeniedError.prototype = Object.create(Error.prototype)

function NotFoundError(message) {
  this.name = 'NotFoundError'
  this.message = (message || '')
}
NotFoundError.prototype = Object.create(Error.prototype)


function UnknownApiError(error) {
  this.name = 'UnknownApiError'
  this.message = error.message
  this.code = error.code
  this.details = error.details
}
UnknownApiError.prototype = Object.create(Error.prototype)


function handleApiError(errObj, observer) {
  if (errObj.code === 'ACCESS_DENIED') {
    return observer.error(new AccessDeniedError('You are not allowed to perform this action.'))
  }
  if (errObj.code === 'NOT_FOUND_ERROR') {
    return observer.error(new NotFoundError(`An installation with label '${config.api.dataset}' not found. Check your installation's sanity.json file.`))
  }
  return observer.error(new UnknownApiError(errObj))
}


const installationChannel = pubsubber()

let _currentInstallation = null

installationChannel.subscribe(val => {
  _currentInstallation = val
})

function currentInstallation() {

  return new Observable(observer => {

    emitInstallation('snapshot')

    function emitInstallation(eventName) {
      installationFetcher.getInstallation(config.api.dataset)
        .then(installation => {
          observer.next({
            event: eventName,
            installation: installation
          })
        })
        .catch(error => {
          handleApiError(error, observer)
        })
    }
  })
}

export default function createInstallationsStore(options = {}) {
  const store = {
    actions: createActions({}),
    currentInstallation: currentInstallation(),
    errors: {
      AccessDeniedError: AccessDeniedError,
      NotFoundError: NotFoundError,
      UnknownApiError: UnknownApiError
    }
  }
  return store
}
