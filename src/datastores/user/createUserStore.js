import Observable from '../utils/SanityStoreObservable'
import createActions from '../utils/createActions'
import pubsubber from '../utils/pubsubber'
import authenticationFetcher from 'machine:@sanity/base/authentication-fetcher'

const userChannel = pubsubber()
const tokenChannel = pubsubber()

let _currentUser = null
let _currentToken = null

userChannel.subscribe(val => {
  _currentUser = val
})

tokenChannel.subscribe(val => {
  _currentToken = val
})

function refreshUser() {
  return authenticationFetcher.getCurrentUser().then(user => {
    userChannel.publish(user)
    return user
  })
}

// Set initial value for user
refreshUser()


function logout() {
  return authenticationFetcher.logout().then(() => {
    userChannel.publish(null)
  })
}

const currentToken = new Observable(observer => {
  pushToken('snapshot', _currentToken)

  return tokenChannel.subscribe(_nextToken => {
    pushToken('change', _nextToken)
  })

  function pushToken(type, token) {
    observer.next({
      type: type,
      token: token
    })
  }
})

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

function refreshTokenAction() {
  const progress = new Observable(observer => {
    refreshToken().then(
      token => observer.next(token),
      error => observer.error(error)
    )
      .then(() => observer.complete())
  })
  return {progress}
}

export default function createUserStore(options = {}) {
  return {
    actions: createActions({
      logout,
      refreshToken: refreshTokenAction
    }),
    currentUser,
    currentToken
  }
}
