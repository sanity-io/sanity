import {Subscription} from 'rxjs'

import {type ProxyHandler} from './createDebugProxy'
import {type ProxyResponse} from './proxy'

export interface ConnectionFlapperOptions {
  /** How long the simulated network stays up, in milliseconds. */
  onlineMs: number
  /** How long it stays down, in milliseconds. */
  offlineMs: number
  /** Called on every transition with the new state. */
  onTransition?: ((online: boolean) => void) | undefined
}

export interface ConnectionFlapper {
  /** Whether the simulated network is currently up. */
  isOnline: () => boolean
  /** Wrap a handler so its requests are subject to the connectivity cycle. */
  wrap: (handler: ProxyHandler) => ProxyHandler
  /** Stop cycling; the current state (online or offline) becomes permanent. */
  stop: () => void
}

/**
 * Simulates flapping connectivity (online → offline → online → …) by cycling
 * between two states on a timer. While online, wrapped handlers proxy
 * normally. On the transition to offline every in-flight response — including
 * live SSE streams — is torn down, and while offline new requests are reset
 * at the socket/stream level, so clients observe the same failure signature
 * as a dead network (`TypeError: Failed to fetch`, `ERR_CONNECTION_RESET`)
 * rather than a clean HTTP error response.
 *
 * One flapper can wrap any number of handlers; they all share the same cycle,
 * the way every request shares the one network cable being pulled.
 */
export function createConnectionFlapper(options: ConnectionFlapperOptions): ConnectionFlapper {
  const {onlineMs, offlineMs, onTransition} = options
  let online = true
  let timer: ReturnType<typeof setTimeout>
  const live = new Set<ProxyResponse>()

  const schedule = () => {
    timer = setTimeout(
      () => {
        online = !online
        if (!online) {
          for (const res of live) {
            res.destroy()
          }
          live.clear()
        }
        onTransition?.(online)
        schedule()
      },
      online ? onlineMs : offlineMs,
    )
  }
  schedule()

  return {
    isOnline: () => online,
    wrap: (handler) => (req, res, target) => {
      if (!online) {
        res.destroy()
        return new Subscription()
      }
      live.add(res)
      res.on('close', () => live.delete(res))
      return handler(req, res, target)
    },
    stop: () => clearTimeout(timer),
  }
}
