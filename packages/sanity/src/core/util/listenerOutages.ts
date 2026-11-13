import {BehaviorSubject, distinctUntilChanged, type Observable} from 'rxjs'

/**
 * Tracks which listeners are down, so a listener that opens a connection while another one is
 * down can start its outage right away instead of waiting out its own welcome timeout.
 *
 * @internal
 */
export interface ListenerOutages {
  /** Whether any listener is down, replayed to every subscriber. */
  down$: Observable<boolean>
  /** The listener owning `token` has failed for a transient reason. */
  start(token: object): void
  /** The listener owning `token` is gone (unsubscribed, completed or errored). */
  end(token: object): void
  /**
   * A listener connected. Listeners that are still down register again on their next failure.
   */
  connected(): void
}

/** @internal */
export function createListenerOutages(): ListenerOutages {
  const tokens = new Set<object>()
  const down = new BehaviorSubject(false)
  const update = () => down.next(tokens.size > 0)
  return {
    down$: down.pipe(distinctUntilChanged()),
    start: (token) => {
      tokens.add(token)
      update()
    },
    end: (token) => {
      tokens.delete(token)
      update()
    },
    connected: () => {
      tokens.clear()
      update()
    },
  }
}

const outagesByProject = new Map<string, ListenerOutages>()

/**
 * The outages of the listeners of one project. Projects can be hosted on different shards, and a
 * listener failure on one shard says nothing about the others, so a workspace only skips its
 * listeners' welcome timeout while another listener of its own project is down. A listener that is
 * down registers for as long as it is subscribed, so the state follows the listeners that exist.
 *
 * @internal
 */
export function listenerOutagesForProject(projectId: string): ListenerOutages {
  const existing = outagesByProject.get(projectId)
  if (existing) return existing
  const outages = createListenerOutages()
  outagesByProject.set(projectId, outages)
  return outages
}
