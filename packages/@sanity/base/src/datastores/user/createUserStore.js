import Observable from '@sanity/observable'
import createActions from '../utils/createActions'
import pubsub from 'nano-pubsub'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import client from 'part:@sanity/base/client'
const userChannel = pubsub()

let _currentUser = null

userChannel.subscribe(val => {
  _currentUser = val
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

const getUser = id => client.request({
  uri: `/users/${id}`,
  withCredentials: true
}).then(user => {
  return user && user.id ? user : null
})

export default function createUserStore(options = {}) {
  return {
    actions: createActions({
      logout
    }),
    currentUser,
    getUser
  }
}
