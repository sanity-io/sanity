import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
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
  mergeMap,
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
import {flatten, groupBy, omit} from 'lodash'
import {createBifurTransport} from './message-transports/bifurTransport'

import userStore from '../user'
import {PresenceLocation, Session} from './types'
import {bifur} from '../../client/bifur'
import {
  DisconnectEvent,
  RollCallEvent,
  StateEvent,
  TransportEvent
} from './message-transports/transport'
import {mock$} from './mock-events'

// todo: consider using sessionStorage for this instead as it will survive page reloads. It needs a way to prevent duplicate ids when opening new windows/tabs
// possibly by using storageEvent to coordinate
// > Opening a page in a new tab or window creates a new session with the value of the top-level browsing context, which differs from how session cookies work.
// https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
export const SESSION_ID = Math.random()
  .toString(32)
  .substring(2)

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

const hideUserId$ = combineLatest([
  userStore.currentUser.pipe(map(currentUserEvent => (currentUserEvent as any).user)),
  debugIntrospect$
]).pipe(map(([currentUser, introspect]) => (introspect ? null : currentUser.id)))

const states$ = merge(syncEvent$, useMock$).pipe(
  withLatestFrom(hideUserId$),
  filter(([event, hideUserId]) => event.userId !== hideUserId),
  map(([event]) => event),
  scan(
    (keyed, event) =>
      event.type === 'disconnect'
        ? omit(keyed, event.sessionId)
        : {...keyed, [event.sessionId]: event},
    {}
  )
)

const allSessions$: Observable<Session[]> = merge(states$, rollCallReplies$).pipe(
  map(sessions => Object.values(sessions))
)

const concatValues = <T>(prev: T[], curr: T): T[] => prev.concat(curr)

export const usersWithSessions$ = allSessions$.pipe(
  map(sessions => groupBy(sessions, 'userId')),
  map((grouped): {userId: string; sessions: Session[]}[] =>
    Object.keys(grouped).map(userId => {
      return {
        userId,
        sessions: grouped[userId]
      }
    })
  )
)

export const globalPresence$ = usersWithSessions$.pipe(
  switchMap(usersWithSessions =>
    from(usersWithSessions).pipe(
      map(userWithSession => ({
        userId: userWithSession.userId,
        status: 'online',
        lastActiveAt: userWithSession.sessions.sort()[0]?.lastActiveAt,
        locations: flatten((userWithSession.sessions || []).map(session => session.locations || []))
          .map(location => ({
            type: location.type,
            documentId: location.documentId,
            path: location.path
          }))
          .reduce(concatValues, [])
      })),
      toArray()
    )
  ),
  switchMap(presenceWithUserIds =>
    from(presenceWithUserIds).pipe(
      mergeMap(({userId, ...rest}) =>
        from(userStore.getUser(userId)).pipe(
          map(user => ({
            user,
            ...rest
          }))
        )
      ),
      toArray()
    )
  )
)

export const documentPresence = (documentId: string) => {
  return globalPresence$.pipe(
    switchMap(globalPresence =>
      from(globalPresence).pipe(
        flatMap(presenceItem =>
          (presenceItem.locations || [])
            .filter(item => item.documentId === documentId)
            .map(location => ({
              user: presenceItem.user,
              status: presenceItem.status,
              lastActiveAt: presenceItem.lastActiveAt,
              path: location.path || []
            }))
        ),
        toArray()
      )
    )
  )
}
