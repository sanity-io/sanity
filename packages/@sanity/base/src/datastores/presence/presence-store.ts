import {
  BehaviorSubject,
  concat,
  defer,
  EMPTY,
  from,
  fromEvent,
  merge,
  NEVER,
  Observable,
  of,
  timer,
} from 'rxjs'

import {
  auditTime,
  distinctUntilChanged,
  filter,
  flatMap,
  map,
  mergeMapTo,
  scan,
  share,
  shareReplay,
  switchMap,
  switchMapTo,
  takeUntil,
  tap,
  toArray,
  withLatestFrom,
} from 'rxjs/operators'
import {flatten, groupBy, omit, uniq} from 'lodash'
import {nanoid} from 'nanoid'

import userStore, {User} from '../user'

import {bifur} from '../../client/bifur'
import {connectionStatus$} from '../connection-status/connection-status-store'
import {
  DisconnectEvent,
  RollCallEvent,
  StateEvent,
  TransportEvent,
} from './message-transports/transport'
import {mock$} from './mock-events'
import {createBifurTransport} from './message-transports/bifurTransport'
import {DocumentPresence, GlobalPresence, PresenceLocation, Session, UserSessionPair} from './types'

const KEY = 'presence_session_id'
const generate = () => nanoid(16)

// We're keeping the session id in sessionStorage as it will survive page reloads.
// todo:
//  There's a potential issue with window.open(...) here as it inherits the top level session storage and thus will
//  re-use session ids:
//    > Opening a page in a new tab or window creates a new session with the value of the top-level browsing context,
//      which differs from how session cookies work.
//      More at https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
//  This is _probably_ a quite marginal case and not going to be much of a issue in practice
function getSessionId() {
  try {
    return window.sessionStorage.getItem(KEY)
  } catch (err) {
    // We don't want to fail hard if session storage can't be accessed for some reason
  }
  return null
}

function setSessionId(id) {
  try {
    window.sessionStorage.setItem(KEY, id)
  } catch (err) {
    // We don't want to fail hard if session storage can't be accessed for some reason
  }
  return id
}

export const SESSION_ID = getSessionId() || setSessionId(generate())

const [presenceEvents$, sendMessage] = createBifurTransport(bifur, SESSION_ID)

const currentLocation$ = new BehaviorSubject<PresenceLocation[]>([])
const locationChange$ = currentLocation$.pipe(distinctUntilChanged())

export const setLocation = (nextLocation: PresenceLocation[]) => {
  currentLocation$.next(nextLocation)
}

export const reportLocations = (locations: PresenceLocation[]) =>
  sendMessage({type: 'state', locations: locations})

const requestRollCall = () => sendMessage({type: 'rollCall'})

const rollCallRequests$ = presenceEvents$.pipe(
  filter((event: TransportEvent): event is RollCallEvent => event.type === 'rollCall'),
  // do not respond to my own rollcall requests
  filter((event: RollCallEvent) => event.sessionId !== SESSION_ID)
)

const REPORT_MIN_INTERVAL = 30000

// Interval to report my own location at
const reportLocationInterval$ = timer(0, REPORT_MIN_INTERVAL)

const reportLocation$ = defer(() => merge(locationChange$, rollCallRequests$)).pipe(
  switchMap(() => reportLocationInterval$),
  withLatestFrom(currentLocation$),
  map(([, locations]) => locations),
  auditTime(200),
  switchMap((locations) => reportLocations(locations)),
  mergeMapTo(EMPTY),
  share()
)

// This represents my rollcall request to other clients
// Note: We are requesting a rollcall whenever we (re)connect
const myRollCall$ = defer(() => requestRollCall()).pipe(mergeMapTo(EMPTY))

const connectionChange$ = connectionStatus$.pipe(
  map((status) => status.type),
  filter((statusType) => statusType === 'connected' || statusType === 'error'),
  distinctUntilChanged()
)

const debugParams$ = concat(of(0), fromEvent(window, 'hashchange')).pipe(
  map(() => document.location.hash.toLowerCase().substring(1).split(';'))
)
const useMock$ = debugParams$.pipe(
  filter((args) => args.includes('give_me_company')),
  switchMapTo(mock$)
)

const debugIntrospect$ = debugParams$.pipe(map((args) => args.includes('introspect')))

const syncEvent$ = merge(myRollCall$, presenceEvents$).pipe(
  filter(
    (event: TransportEvent): event is StateEvent | DisconnectEvent =>
      event.type === 'state' || event.type === 'disconnect'
  )
)

const stateEventToSession = (stateEvent: StateEvent): Session => {
  return {
    lastActiveAt: stateEvent.timestamp,
    locations: stateEvent.locations,
    sessionId: stateEvent.sessionId,
    userId: stateEvent.userId,
  }
}

const states$: Observable<{[sessionId: string]: Session}> = merge(syncEvent$, useMock$).pipe(
  scan(
    (keyed, event: StateEvent | DisconnectEvent): {[sessionId: string]: Session} =>
      event.type === 'disconnect'
        ? omit(keyed, event.sessionId)
        : {...keyed, [event.sessionId]: stateEventToSession(event)},
    {}
  )
)

const allSessions$: Observable<UserSessionPair[]> = connectionChange$.pipe(
  switchMap((status) => (status === 'connected' ? merge(states$, reportLocation$) : NEVER)),
  map((keyedSessions) => Object.values(keyedSessions)),
  switchMap((sessions) => {
    const userIds = uniq(sessions.map((sess) => sess.userId))
    return from(userStore.getUsers(userIds)).pipe(
      map((users) =>
        sessions.map(
          (session): UserSessionPair => ({
            user: users.find((res) => res.id === session.userId) as User,
            session: session,
          })
        )
      )
    )
  }),
  takeUntil(
    fromEvent(window, 'beforeunload').pipe(switchMap(() => sendMessage({type: 'disconnect'})))
  ),
  shareReplay({refCount: true, bufferSize: 1})
)

export const globalPresence$: Observable<GlobalPresence[]> = allSessions$.pipe(
  map((sessions): {user: User; sessions: Session[]}[] => {
    const grouped = groupBy(
      sessions.map((s) => s.session),
      (e) => e.userId
    )

    return Object.keys(grouped).map((userId): {user: User; sessions: Session[]} => ({
      user: sessions.find((s) => s.user.id === userId)?.user as User,
      sessions: grouped[userId],
    }))
  }),
  withLatestFrom(debugIntrospect$),
  map(([userAndSessions, debugIntrospect]) =>
    userAndSessions.filter((userAndSession) => {
      if (debugIntrospect) {
        return true
      }

      const isCurrent = userAndSession.sessions.some((sess) => sess.sessionId === SESSION_ID)

      return !isCurrent
    })
  ),
  map((userAndSessions) =>
    userAndSessions.map((userAndSession) => ({
      user: userAndSession.user,
      status: 'online',
      lastActiveAt: userAndSession.sessions.sort()[0]?.lastActiveAt,
      locations: flatten((userAndSession.sessions || []).map((session) => session.locations || []))
        .map((location) => ({
          type: location.type,
          documentId: location.documentId,
          path: location.path,
          lastActiveAt: location.lastActiveAt,
        }))
        .reduce((prev, curr) => prev.concat(curr), [] as PresenceLocation[]),
    }))
  )
)

export const documentPresence = (documentId: string): Observable<DocumentPresence[]> => {
  return allSessions$.pipe(
    withLatestFrom(debugIntrospect$),
    switchMap(([userAndSessions, debugIntrospect]) =>
      from(userAndSessions).pipe(
        filter(
          (userAndSession) => debugIntrospect || userAndSession.session.sessionId !== SESSION_ID
        ),
        flatMap((userAndSession) =>
          (userAndSession.session.locations || [])
            .filter((item) => item.documentId === documentId)
            .map((location) => ({
              user: userAndSession.user,
              lastActiveAt: userAndSession.session.lastActiveAt,
              path: location.path || [],
            }))
        ),
        toArray()
      )
    )
  )
}
