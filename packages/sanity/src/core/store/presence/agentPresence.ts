import {Observable, type OperatorFunction} from 'rxjs'

import {type TransportEvent} from './message-transports/transport'
import {type PresenceActor, type Session} from './types'

export const AGENT_PRESENCE_GRACE_MS = 2_000
export const AGENT_PRESENCE_STALE_MS = 90_000

export function parsePresenceActor(value: unknown): PresenceActor | undefined {
  if (!value || typeof value !== 'object' || !('type' in value) || value.type !== 'agent') {
    return undefined
  }
  if ('id' in value && typeof value.id === 'string' && /^[\w-]{1,128}$/.test(value.id)) {
    return {type: 'agent', id: value.id}
  }
  return {type: 'agent'}
}

export function presenceIdentity(presence: {
  user: {id: string}
  actor?: PresenceActor
  sessionId?: string
}): string {
  if (presence.actor?.type === 'agent') {
    return JSON.stringify([presence.user.id, 'agent', presence.actor.id ?? presence.sessionId])
  }
  return JSON.stringify([presence.user.id, 'human'])
}

/** Keep wire sessions separate: one operation's leave must not remove another's presence. */
export function observePresenceSessions(): OperatorFunction<TransportEvent, Session[]> {
  return (source) =>
    new Observable((subscriber) => {
      const sessions = new Map<string, {session: Session; receivedAt: number}>()
      let expiry: ReturnType<typeof setTimeout> | undefined
      const emit = () => {
        clearTimeout(expiry)
        const now = Date.now()
        let nextExpiry = Infinity
        for (const [key, value] of sessions) {
          if (value.session.actor?.type !== 'agent') continue
          const expiresAt = value.receivedAt + AGENT_PRESENCE_STALE_MS
          if (expiresAt <= now) sessions.delete(key)
          else nextExpiry = Math.min(nextExpiry, expiresAt)
        }
        subscriber.next(Array.from(sessions.values(), ({session}) => session))
        if (Number.isFinite(nextExpiry)) expiry = setTimeout(emit, nextExpiry - now)
      }
      const subscription = source.subscribe({
        next(event) {
          if (event.type === 'rollCall') return
          const key = JSON.stringify([event.userId, event.sessionId])
          if (event.type === 'disconnect') sessions.delete(key)
          else
            sessions.set(key, {
              session: {
                userId: event.userId,
                sessionId: event.sessionId,
                locations: event.locations,
                lastActiveAt: event.timestamp,
                actor: event.actor,
              },
              receivedAt: Date.now(),
            })
          emit()
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      })
      return () => {
        subscription.unsubscribe()
        clearTimeout(expiry)
      }
    })
}

/** Display-only retention, scoped to each agent/document/path rather than the whole visit. */
export function smoothAgentPresence(): OperatorFunction<Session[], Session[]> {
  return (source) =>
    new Observable((subscriber) => {
      const retained = new Map<string, {session: Session; removeAt?: number}>()
      let humans: Session[] = []
      let expiry: ReturnType<typeof setTimeout> | undefined
      const emit = () => {
        clearTimeout(expiry)
        const agents = new Map<string, Session>()
        const now = Date.now()
        let nextExpiry = Infinity
        for (const [key, value] of retained) {
          if (value.removeAt !== undefined) {
            if (value.removeAt <= now) {
              retained.delete(key)
              continue
            }
            nextExpiry = Math.min(nextExpiry, value.removeAt)
          }
          const session = value.session
          const identity = presenceIdentity({user: {id: session.userId}, ...session})
          const existing = agents.get(identity)
          if (existing) existing.locations.push(...session.locations)
          else agents.set(identity, {...session, locations: [...session.locations]})
        }
        subscriber.next([...humans, ...agents.values()])
        if (Number.isFinite(nextExpiry)) expiry = setTimeout(emit, nextExpiry - now)
      }
      const subscription = source.subscribe({
        next(sessions) {
          humans = sessions.filter((session) => session.actor?.type !== 'agent')
          const current = new Map<string, Session>()
          for (const session of sessions) {
            if (session.actor?.type !== 'agent') continue
            const identity = presenceIdentity({user: {id: session.userId}, ...session})
            for (const location of session.locations) {
              const key = JSON.stringify([identity, location.documentId, location.path])
              current.set(key, {...session, sessionId: identity, locations: [location]})
            }
          }
          for (const [key, session] of current) retained.set(key, {session})
          for (const [key, value] of retained) {
            if (!current.has(key) && value.removeAt === undefined) {
              value.removeAt = Date.now() + AGENT_PRESENCE_GRACE_MS
            }
          }
          emit()
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      })
      return () => {
        subscription.unsubscribe()
        clearTimeout(expiry)
      }
    })
}
