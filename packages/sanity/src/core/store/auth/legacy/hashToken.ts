import {takeHashParam, takeStashedAuthHashParam} from './authHashParams'

const isValidToken = (value: string | undefined): value is string =>
  value !== undefined && value.length >= 32

function readAndRemoveHashToken(): string | undefined {
  // Always removed from the URL, even when the studio HTML already stashed one.
  const fromHash = takeHashParam('token')
  const token = takeStashedAuthHashParam('token') ?? fromHash
  return isValidToken(token) ? token : undefined
}

// Taken at load, so a studio that fails to boot never leaves the token in the URL.
let pendingToken = readAndRemoveHashToken()

/**
 * Removes the token from the URL again, since a host may restore the hash after load, and holds it
 * for a store that can use it.
 */
export function removeHashTokenFromUrl(): void {
  const fromHash = readAndRemoveHashToken()
  pendingToken = pendingToken ?? fromHash
}

export function consumeHashToken(): string | undefined {
  removeHashTokenFromUrl()
  const token = pendingToken
  pendingToken = undefined
  return token
}
