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

authenticationFetcher.getCurrentUser().then(user => {
  // Set initial value
  userChannel.publish(user)
})


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

export default function createUserStore(options = {}) {
  return {
    actions: createActions({
      logout: logout,
    }),
    currentUser,
    currentToken
  }
}
