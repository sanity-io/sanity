import {
  asyncScheduler,
  BehaviorSubject,
  concat,
  defer,
  EMPTY,
  from,
  fromEvent,
  interval,
  merge,
  Observable,
  of
} from 'rxjs'

import {
  filter,
  flatMap,
  map,
  mergeMapTo,
  scan,
  share,
  switchMap,
  switchMapTo,
  take,
  throttleTime,
  toArray,
  withLatestFrom
} from 'rxjs/operators'
import {flatten, groupBy, omit, uniq} from 'lodash'
import {createBifurTransport} from './message-transports/bifurTransport'
import {nanoid} from 'nanoid'

import userStore from '../user'
import {PresenceLocation, Session, User} from './types'
import {bifur} from '../../client/bifur'
import {
  DisconnectEvent,
  RollCallEvent,
  StateEvent,
  TransportEvent
} from './message-transports/transport'
import {mock$} from './mock-events'

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

const locationChange = new BehaviorSubject(null)

export const setLocation = (nextLocation: PresenceLocation[]) => {
  locationChange.next(nextLocation)
}

export const reportLocations = (locations: PresenceLocation[]) =>
  sendMessage({type: 'state', locations: locations})

const requestRollCall = () => sendMessage({type: 'rollCall'})

const rollCallRequests$ = presenceEvents$.pipe(
  filter((event: TransportEvent): event is RollCallEvent => event.type === 'rollCall')
)

// Interval to report my own location at
const reportLocationInterval$ = interval(10000)

const rollCallReplies$ = merge(locationChange, reportLocationInterval$, rollCallRequests$).pipe(
  withLatestFrom(locationChange),
  throttleTime(200, asyncScheduler, {leading: false, trailing: true}),
  map(([, currentLocation]) => currentLocation),
  switchMap(locations => reportLocations(locations)),
  mergeMapTo(EMPTY)
)

// This is my rollcall to other clients
const initialRollCall$ = defer(() => from(requestRollCall()).pipe(take(1), mergeMapTo(EMPTY)))

const syncEvent$ = merge(initialRollCall$, presenceEvents$).pipe(
  filter(
    (event: TransportEvent): event is StateEvent | DisconnectEvent =>
      event.type === 'state' || event.type === 'disconnect'
  ),
  share()
)

const debugParams$ = concat(of(0), fromEvent(window, 'hashchange')).pipe(
  map(() =>
    document.location.hash
      .toLowerCase()
      .substring(1)
      .split(';')
  )
)
const useMock$ = debugParams$.pipe(
  filter(args => args.includes('give_me_company')),
  switchMapTo(mock$)
)

const debugIntrospect$ = debugParams$.pipe(map(args => args.includes('introspect')))

const states$: Observable<{[sessionId: string]: Session}> = merge(syncEvent$, useMock$).pipe(
  scan(
    (keyed, event) =>
      event.type === 'disconnect'
        ? omit(keyed, event.sessionId)
        : {...keyed, [event.sessionId]: event},
    {}
  )
)

const allSessions$: Observable<{user: User; session: Session}[]> = merge(
  states$,
  rollCallReplies$
).pipe(
  map(keyedSessions => Object.values(keyedSessions)),
  switchMap(sessions => {
    const userIds = uniq(sessions.map(sess => sess.userId))
    return from(userStore.getUsers(userIds)).pipe(
      map(users =>
        sessions.map((session): {user: User; session: Session} => ({
          user: users.find(res => res.id === session.userId),
          session: session
        }))
      )
    )
  })
)

const concatValues = <T>(prev: T[], curr: T): T[] => prev.concat(curr)

export const globalPresence$ = allSessions$.pipe(
  map((sessions): {user: User; sessions: Session[]}[] => {
    const grouped = groupBy(
      sessions.map(s => s.session),
      e => e.userId
    )

    return Object.keys(grouped).map((userId): {user: User; sessions: Session[]} => ({
      user: sessions.find(s => s.user.id === userId).user,
      sessions: grouped[userId]
    }))
  }),
  withLatestFrom(debugIntrospect$),
  map(([userAndSessions, debugIntrospect]) =>
    userAndSessions.filter(userAndSession => {
      if (debugIntrospect) {
        return true
      }
      const isCurrent = userAndSession.sessions.some(sess => sess.sessionId === SESSION_ID)
      return !isCurrent || userAndSession.sessions.length > 1
    })
  ),
  map(userAndSessions =>
    userAndSessions.map(userAndSession => ({
      user: userAndSession.user,
      lastActiveAt: userAndSession.sessions.sort()[0]?.lastActiveAt,
      locations: flatten((userAndSession.sessions || []).map(session => session.locations || []))
        .map(location => ({
          type: location.type,
          documentId: location.documentId,
          path: location.path
        }))
        .reduce(concatValues, [])
    }))
  )
)

export const documentPresence = (documentId: string) => {
  return allSessions$.pipe(
    withLatestFrom(debugIntrospect$),
    switchMap(([userAndSessions, debugIntrospect]) =>
      from(userAndSessions).pipe(
        filter(
          userAndSession => debugIntrospect || userAndSession.session.sessionId !== SESSION_ID
        ),
        flatMap(userAndSession =>
          (userAndSession.session.locations || [])
            .filter(item => item.documentId === documentId)
            .map(location => ({
              user: userAndSession.user,
              lastActiveAt: userAndSession.session.lastActiveAt,
              path: location.path || []
            }))
        ),
        toArray()
      )
    )
  )
}
