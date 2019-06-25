import {Observable} from 'rxjs'
import createActions from '../utils/createActions'
import pubsub from 'nano-pubsub'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import client from 'part:@sanity/base/client'

const userChannel = pubsub()
const errorChannel = pubsub()

let _initialFetched = false
let _currentUser = null
let _currentError = null

userChannel.subscribe(val => {
  _currentUser = val
})

errorChannel.subscribe(val => {
  _currentError = val
})

function fetchInitial() {
  return authenticationFetcher
    .getCurrentUser()
    .then(user => userChannel.publish(user), err => errorChannel.publish(err))
}

function logout() {
  return authenticationFetcher
    .logout()
    .then(() => userChannel.publish(null), err => errorChannel.publish(err))
}

const currentUser = new Observable(observer => {
  if (_initialFetched) {
    const emitter = _currentError ? emitError : emitSnapshot
    emitter(_currentError || _currentUser)
  } else {
    _initialFetched = true
    fetchInitial()
  }

  const unsubUser = userChannel.subscribe(nextUser => emitSnapshot(nextUser))
  const unsubError = errorChannel.subscribe(err => emitError(err))
  const unsubscribe = () => {
    unsubUser()
    unsubError()
  }

  return unsubscribe

  function emitError(error) {
    observer.next({type: 'error', error})
  }

  function emitSnapshot(user) {
    observer.next({type: 'snapshot', user})
  }
})

const userCache = {}

const getUser = id => {
  if (!userCache[id]) {
    userCache[id] = client
      .request({
        uri: `/users/${id}`,
        withCredentials: true
      })
      .then(user => {
        return user && user.id ? user : null
      })
  }

  return userCache[id]
}

// TODO Optimize for getting all users in one query
const getUsers = ids => {
  return Promise.all(ids.map(id => getUser(id)))
}

export default function createUserStore(options = {}) {
  return {
    actions: createActions({logout, retry: fetchInitial}),
    currentUser,
    getUser,
    getUsers
  }
}
