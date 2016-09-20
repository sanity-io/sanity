import Observable from '../utils/SanityStoreObservable'
import createActions from '../utils/createActions'
import pubsubber from '../utils/pubsubber'
import projectFetcher from 'part:@sanity/base/project-fetcher'
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
    return observer.error(
      new NotFoundError(`An project with label '${config.api.dataset}' not found. Check your project's sanity.json file.`)
    )
  }
  return observer.error(new UnknownApiError(errObj))
}


const projectChannel = pubsubber()

let _currentProject = null

projectChannel.subscribe(val => {
  _currentProject = val
})

function currentProject() {

  return new Observable(observer => {

    emitProject('snapshot')

    function emitProject(eventName) {
      projectFetcher.getProject(config.api.dataset)
        .then(project => {
          observer.next({
            event: eventName,
            project: project
          })
        })
        .catch(error => {
          handleApiError(error, observer)
        })
    }
  })
}

export default function createProjectsStore(options = {}) {
  return {
    actions: createActions({}),
    currentProject: currentProject(),
    errors: {
      AccessDeniedError: AccessDeniedError,
      NotFoundError: NotFoundError,
      UnknownApiError: UnknownApiError
    }
  }
}
