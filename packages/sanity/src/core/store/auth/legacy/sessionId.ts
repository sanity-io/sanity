import {takeHashParam, takeStashedAuthHashParam} from './authHashParams'

const isValidSessionId = (value: string | undefined): value is string =>
  value !== undefined && value.length >= 20

function consumeSessionId(): string | undefined {
  // Always removed from the URL, even when the studio HTML already stashed one.
  const fromHash = takeHashParam('sid')
  const sessionId = takeStashedAuthHashParam('sid') ?? fromHash
  return isValidSessionId(sessionId) ? sessionId : undefined
}

/**
 * Provides a workaround for https://github.com/vercel/next.js/issues/91819
 * Can be removed once that's fixed
 */
export function clearHashSessionId(): void {
  consumeSessionId()
}

// this module consumes the session ID as a side-effect as soon as its loaded
// to remove the session ID from the history (vs waiting to remove the sid hash
// until react mounts). Once it is consumed and loaded once, we don't want to
// keep it in-memory here, so we clear it out.
let sessionId = consumeSessionId()
export const getHashSessionId = (): string | undefined => {
  const id = sessionId
  if (id) {
    sessionId = undefined
  }
  return id
}
