import {takeHashParam, takeStashedAuthHashParam} from './authHashParams'

const isValidToken = (value: string | undefined): value is string =>
  value !== undefined && value.length >= 32

function readAndRemoveHashToken(): string | undefined {
  // Always removed from the URL, even when the studio HTML already stashed one.
  const fromHash = takeHashParam('token')
  const token = takeStashedAuthHashParam('token') ?? fromHash
  return isValidToken(token) ? token : undefined
}

// Like the session ID, the token is removed from the URL as a side-effect as soon as this
// module loads, rather than when the first auth store is created: a studio that fails to
// boot (a schema error, a crashing plugin) never creates one, and would otherwise leave the
// token in the address bar and the session history. It is held here until an auth store
// consumes it, then cleared so it doesn't linger in memory.
let pendingToken = readAndRemoveHashToken()

export const consumeHashToken = (): string | undefined => {
  const token = pendingToken ?? readAndRemoveHashToken()
  pendingToken = undefined
  return token
}
