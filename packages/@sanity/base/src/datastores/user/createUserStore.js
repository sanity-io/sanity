import Observable from '@sanity/observable'
import createActions from '../utils/createActions'
import pubsub from 'nano-pubsub'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import client from 'part:@sanity/base/client'

const userChannel = pubsub()

let _initialFetched = false
let _currentUser = null

userChannel.subscribe(val => {
  _currentUser = val
})

function fetchInitial() {
  authenticationFetcher.getCurrentUser().then(user => {
    userChannel.publish(user)
  })
}

function logout() {
  return authenticationFetcher.logout().then(() => {
    userChannel.publish(null)
  })
}

const currentUser = new Observable(observer => {

  if (_initialFetched) {
    emitSnapshot(_currentUser)
  } else {
    _initialFetched = true
    fetchInitial()
  }

  return userChannel.subscribe(nextUser => {
    emitSnapshot(nextUser)
  })

  function emitSnapshot(user) {
    observer.next({
      type: 'snapshot',
      user
    })
  }
})

const userCache = {}

const getUser = id => {

  if (!userCache[id]) {
    userCache[id] = client.request({
      uri: `/users/${id}`,
      withCredentials: true
    })
    .then(user => {
      return (user && user.id) ? user : null
    })
  }

  return userCache[id]
}

export default function createUserStore(options = {}) {
  return {
    actions: createActions({
      logout
    }),
    currentUser,
    getUser
  }
}
