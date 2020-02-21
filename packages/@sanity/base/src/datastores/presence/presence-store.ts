import {EMPTY, merge, of, timer, BehaviorSubject} from 'rxjs'
import {
  map,
  mapTo,
  scan,
  startWith,
  tap,
  withLatestFrom,
  mergeMapTo,
  switchMap,
  mergeMap
} from 'rxjs/operators'
import {groupBy, omit} from 'lodash'
import {createReflectorTransport} from './message-transports/reflectorTransport'

export const CLIENT_ID = Math.random()
  .toString(32)
  .substring(2)

type PresenceLocation = {
  namespace: string
  documentId?: string
  path?: (string | {})[]
}

const [events$, sendMessages] = createReflectorTransport<PresenceLocation[]>('presence', CLIENT_ID)

type PrivacyType = 'anonymous' | 'private' | 'dataset' | 'visible'
const privacy$ = new BehaviorSubject<PrivacyType>('visible')
const location$ = new BehaviorSubject(null)

export const setPrivacy = (privacy: PrivacyType) => {
  privacy$.next(privacy)
}
export const setLocation = (nextLocation: PresenceLocation[]) => {
  location$.next(nextLocation)
}

export const reportLocation = location => {
  console.log('reporting lcoation', location)
  return sendMessages([
    {
      type: 'sync',
      state: location
    }
  ])
}

const requestRollCall = () =>
  sendMessages([
    {
      type: 'rollCall'
    }
  ])

const reportLocation$ = merge(
  location$.pipe(switchMap(loc => timer(0, 10000).pipe(mapTo(loc))))
).pipe(
  withLatestFrom(privacy$),
  tap(([loc, privacy]) => {
    if (privacy === 'visible') {
      reportLocation(loc)
    }
  })
)
const purgeOld = clients => {
  const oldIds = Object.keys(clients).filter(
    id => new Date().getTime() - new Date(clients[id].timestamp).getTime() > 60 * 1000
  )
  return omit(clients, oldIds)
}

const purgeOld$ = timer(0, 10000).pipe(mapTo({type: 'purgeOld', clientId: CLIENT_ID}))

export const clients$ = merge(
  events$.pipe(
    // tap(console.log),
    withLatestFrom(location$, privacy$),
    mergeMap(([event, location, privacy]) => {
      if (event.type === 'rollCall' && privacy === 'visible') {
        reportLocation(location)
        return EMPTY
      }
      return of(event)
    })
  ),
  purgeOld$,
  merge(reportLocation$).pipe(mergeMapTo(EMPTY))
).pipe(
  scan((clients, event: any) => {
    if (event.type === 'welcome') {
      // i am connected and can safely request a rollcall
      requestRollCall()
      return clients
    }
    if (event.type === 'sync') {
      return {...clients, [event.clientId]: event}
    }
    if (event.type === 'disconnect') {
      return omit(clients, event.clientId)
    }
    if (event.type === 'purgeOld') {
      return purgeOld(clients)
    }
    return clients
  }, {}),
  startWith({}),
  map(clients => Object.values(clients)),
  map(clients => groupBy(clients, 'identity')),
  map(grouped =>
    Object.keys(grouped).map(identity => {
      return {
        identity,
        sessions: grouped[identity].map((session: any) => omit(session, 'identity'))
      }
    })
  )
)
