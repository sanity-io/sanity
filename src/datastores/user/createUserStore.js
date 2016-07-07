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

function getCurrentUser() {
  return authenticationFetcher.getCurrentUser()
}

getCurrentUser().then(user => {
  userChannel.publish(user)
})


function logout() {
  return new Promise((resolve,reject) => {
    authenticationFetcher.logout()
    .then(() => {
      userChannel.publish(null)
      resolve()
    })
  })
}


const currentToken = new Observable(observer => {

  nextToken('snapshot', _currentToken)

  return tokenChannel.subscribe(nextToken => {
    nextToken('change', nextToken)
  })

  function nextToken(type, token) {
    authenticationFetcher.getToken()
    .then(token => {
      observer.next({
        type: type,
        token: token
      })
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
