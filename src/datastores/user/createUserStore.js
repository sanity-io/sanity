import Observable from '../utils/SanityStoreObservable'
import createActions from '../utils/createActions'
import pubsubber from '../utils/pubsubber'
import authenticationFetcher from 'machine:@sanity/base/authentication-fetcher'

const userChannel = pubsubber()

let _currentUser = null

userChannel.subscribe(val => {
  _currentUser = val
})

function getCurrentUser() {
  return authenticationFetcher.getCurrentUser()
}

getCurrentUser().then(user => {
  userChannel.publish(user)
})


function logout() {
  const progress = new Observable(observer => {
    observer.next({
      type: 'logout',
      user: _currentUser
    })

    xr(
      {
        withCredentials: true,
        method: xr.Methods.GET,
        headers: {
          Accept: '*/*'
        },
        url: '/api/sanction/v1/users/logout',
      }
    )
    .then(() => {
      userChannel.publish(null)
      observer.complete()
    })
  })

  return {progress}
}

function unsetUser() {
  const progress = new Observable(observer => {
    observer.next({
      type: 'unset',
      user: _currentUser
    })
    userChannel.publish(null)
    observer.complete()
  })
  return {progress}
}

function login(username, password) {
  const progress = new Observable(observer => {
    observer.next({
      type: 'begin'
    })

    const authenticatedUser = {username}
    const ev = {
      type: username ? 'success' : 'failure',
      user: authenticatedUser
    }

    setTimeout(() => {
      observer.next(ev)
      observer.complete()
      userChannel.publish(authenticatedUser)
    }, 400)
  })
  return {progress}
}

const currentUser = new Observable(observer => {

  emitUser('snapshot', _currentUser)

  return userChannel.subscribe(nextUser => {
    emitUser('change', nextUser)
  })

  function emitUser(type, user) {
    observer.next({
      type: type,
      user
    })
  }
})

export default function createUserStore(options = {}) {
  return {
    actions: createActions({
      login: login,
      logout: logout,
      unsetUser: unsetUser
    }),
    currentUser
  }
}
