import sanityClient from '@sanity/client-next'
import config from 'config:sanity'
import userStore from 'datastore:@sanity/base/user'

const MS_BEFORE_EXPIRATION_TO_RENEW_TOKEN = 60*2*1000 // How many ms left of token expiration time before we obtain a new token
let currentTokenPayload = null

function base64urlDecode(str) {
  return window.atob(base64urlUnescape(str))
}

function base64urlUnescape(str) {
  str += new Array(5 - str.length % 4).join('=')
  return str.replace(/\-/g, '+').replace(/_/g, '/')
}

function extractTokenPayload(token) {
  const segments = token.split('.')
  const payloadSeg = segments[1]
  return JSON.parse(base64urlDecode(payloadSeg))
}

function tokenIsExpired(tokenPayload) {
  if (!tokenPayload) {
    return true
  }
  const tokenTime  = currentTokenPayload.x * 1000
  const now = Date.now()
  if ((tokenTime - now) > MS_BEFORE_EXPIRATION_TO_RENEW_TOKEN) {
    return false
  }
  return true
}

function updateClientTokenPromise() {
  return new Promise((resolve, reject) => {
    if (!tokenIsExpired(currentTokenPayload)) {
      return resolve()
    }
    userStore.currentToken
      .map(ev => ev.token)
      .subscribe(token => {
        currentTokenPayload = extractTokenPayload(token)
        client.config({token})
        resolve()
      })
  })
}

const client = sanityClient(config.api)
client.on('request', updateClientTokenPromise)

export default client
