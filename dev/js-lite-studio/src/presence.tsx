/**
 * Presence, the JS studio's protocol (`createPresenceStore` over `@sanity/bifur-client`), so this
 * studio, the Rust one and the JS one see each other: the same socket methods
 * (`presence_rollcall`, `presence_announce`), the same session id storage, the same location
 * format (`{type: "document", documentId, path, lastActiveAt, selection?}`, with a Portable Text
 * selection in `@portabletext/editor`'s point format) and the same user colors.
 */
import {type BifurClient, fromUrl} from '@sanity/bifur-client'
import {type ColorHueKey, hues} from '@sanity/color'
import {Avatar} from '@sanity/ui'
import {useSyncExternalStore} from 'react'
import {BehaviorSubject, type Subscription, timer} from 'rxjs'
import {retry} from 'rxjs/operators'

import {initials, type User, userFromJson} from './auth'
import {client} from './client'
import {API_HOST, DATASET, PROJECT_ID, REQUEST_TAG_PREFIX} from './config'
import {type Path, pathStartsWith, samePath} from './paths'
import {Atom} from './state'
import {isObject, type Json, nowIso, publishedId, randomKey} from './util'

export interface Location {
  documentId: string
  path: Path
  selection?: Json
}

interface Session {
  sessionId: string
  userId: string
  locations: Location[]
}

/** Someone else at a location in a document. */
export interface Present {
  sessionId: string
  user: User
  hue: ColorHueKey
  location: Location
}

const SESSION_KEY = 'presence_session_id'
/** The JS store reports at least this often, so other sessions can tell it is still there. */
const REPORT_INTERVAL_MS = 30_000
/** Like the JS form, which throttles focus changes to one a second and reports 200 ms later. */
const REPORT_MIN_GAP_MS = 1000
const REPORT_DELAY_MS = 200

/** The hues users get, `@sanity/color`'s `COLOR_HUES` without green and red (which read as added
 * and removed) and gray (which reads as no color). */
const USER_HUES: ColorHueKey[] = ['blue', 'purple', 'magenta', 'orange', 'yellow', 'cyan']

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = randomKey(16)
    window.sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return randomKey(16)
  }
}

/** The color the JS studio's user color manager prefers for a user: purple for the current
 * user, a hash of the id into the user hues for everyone else. */
export function userHue(userId: string, currentUser: string | undefined): ColorHueKey {
  if (userId === currentUser) return 'purple'
  let hash = 0
  for (let index = 0; index < userId.length; index++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(index)) | 0
  }
  return USER_HUES[Math.abs(hash) % USER_HUES.length]
}

export function hueTint(hue: ColorHueKey, tint: '50' | '400' | '500' | '900'): string {
  return hues[hue][tint].hex
}

function locationFromJson(value: unknown): Location | undefined {
  if (!isObject(value) || value.type !== 'document' || typeof value.documentId !== 'string')
    return undefined
  return {
    documentId: value.documentId,
    path: Array.isArray(value.path) ? (value.path as Path) : [],
    selection: isObject(value.selection) ? value.selection : undefined,
  }
}

const ownSession = sessionId()
let bifur: BifurClient | undefined
let subscriptions: Subscription[] = []
let currentUser: string | undefined
const sessions = new Atom<Map<string, Session>>(new Map())
const users = new Atom<Map<string, User>>(new Map())
const requested = new Set<string>()
let location: Location[] = []
let reportTimer: ReturnType<typeof setTimeout> | undefined
let lastReport = Number.NEGATIVE_INFINITY
export const presenceConnected = new Atom(false)

/** Connects once the user is signed in. */
export function startPresence(user: User): void {
  if (bifur) return
  currentUser = user.id
  users.set(new Map([[user.id, user]]))
  const url = `wss://${PROJECT_ID}.${API_HOST}/v2022-06-30/socket/${DATASET}?tag=${REQUEST_TAG_PREFIX}`
  const token = client().config().token
  // bifur subscribes on every new socket, so `auth` must replay its latest value.
  bifur = fromUrl(url, {
    auth: new BehaviorSubject(
      Promise.resolve(token ? {token} : ({withCredentials: true} as const)),
    ),
    idleTimeout: 5_000,
  })
  const backoff = (_error: unknown, count: number) => {
    presenceConnected.set(false)
    sessions.set(new Map())
    return timer(Math.min(1000 * 2 ** (count - 1), 60_000))
  }
  // Every (re)connect asks the others to announce themselves and announces this session.
  subscriptions.push(
    bifur.heartbeats.pipe(retry({delay: backoff, resetOnSuccess: true})).subscribe(() => {
      if (presenceConnected.get()) return
      presenceConnected.set(true)
      sessions.set(new Map())
      send('presence_rollcall', {session: ownSession})
      report()
    }),
  )
  subscriptions.push(
    bifur
      .listen<{type: string; i?: string; m?: Json; session?: string}>('presence')
      .pipe(retry({delay: backoff, resetOnSuccess: true}))
      .subscribe({next: onMessage}),
  )
  setInterval(report, REPORT_INTERVAL_MS)
}

export function stopPresence(): void {
  for (const subscription of subscriptions) subscription.unsubscribe()
  subscriptions = []
}

function onMessage(message: {type: string; i?: string; m?: Json; session?: string}): void {
  const userId = message.i ?? ''
  switch (message.type) {
    case 'rollCall':
      if (message.session !== ownSession) report()
      break
    case 'state': {
      const state = isObject(message.m) ? message.m : undefined
      const id = typeof state?.sessionId === 'string' ? state.sessionId : undefined
      if (!id || id === ownSession) return
      const locations = Array.isArray(state?.locations)
        ? state.locations.flatMap((item) => locationFromJson(item) ?? [])
        : []
      sessions.update((current) => new Map(current).set(id, {sessionId: id, userId, locations}))
      loadUser(userId)
      break
    }
    case 'disconnect': {
      const id =
        isObject(message.m) && typeof message.m.session === 'string' ? message.m.session : undefined
      if (!id || !sessions.get().has(id)) return
      sessions.update((current) => {
        const next = new Map(current)
        next.delete(id)
        return next
      })
      break
    }
    default:
  }
}

function loadUser(userId: string): void {
  if (!userId || requested.has(userId) || users.get().has(userId)) return
  requested.add(userId)
  client()
    .request({url: `/users/${userId}`, tag: 'users.get'})
    .then((profiles: unknown) => {
      const list = Array.isArray(profiles) ? profiles : [profiles]
      users.update((current) => {
        const next = new Map(current)
        for (const profile of list) {
          if (!isObject(profile)) continue
          const user = userFromJson({
            id: profile.id,
            name: profile.displayName || profile.name,
            email: profile.email,
            profileImage: profile.imageUrl || profile.profileImage,
          })
          if (user) next.set(user.id, user)
        }
        return next
      })
    })
    .catch(() => requested.delete(userId))
}

function send(
  method: 'presence_rollcall' | 'presence_announce',
  params: Record<string, Json>,
): void {
  bifur?.request(method, params).subscribe({error: () => undefined})
}

/** Announces this session's locations now. */
function report(): void {
  lastReport = performance.now()
  const now = nowIso()
  const locations = location.map((item) => {
    const value: Record<string, Json> = {
      type: 'document',
      documentId: item.documentId,
      path: item.path as Json,
      lastActiveAt: now,
    }
    if (item.selection) value.selection = item.selection
    return value
  })
  send('presence_announce', {data: {locations, sessionId: ownSession}})
}

function scheduleReport(): void {
  if (reportTimer !== undefined) return
  const wait = Math.max(lastReport + REPORT_MIN_GAP_MS - performance.now(), REPORT_DELAY_MS)
  reportTimer = setTimeout(() => {
    reportTimer = undefined
    report()
  }, wait)
}

/** Where this session is: a document, the path of the field in focus (empty for the document
 * itself) and the Portable Text selection when the focus is in an editor. */
export function setLocation(documentId: string, path: Path, selection?: Json): void {
  const next: Location = {documentId, path, selection}
  const current = location[0]
  if (
    location.length === 1 &&
    current.documentId === documentId &&
    samePath(current.path, path) &&
    JSON.stringify(current.selection) === JSON.stringify(selection)
  ) {
    return
  }
  location = [next]
  scheduleReport()
}

/** Leaves the document, when its pane closes. */
export function leave(published: string): void {
  if (location.some((item) => publishedId(item.documentId) === published)) {
    location = []
    scheduleReport()
  }
}

export function currentUserId(): string | undefined {
  return currentUser
}

export function useUser(userId: string | undefined): User | undefined {
  const known = useSyncExternalStore(users.subscribe, users.get)
  if (!userId) return undefined
  const user = known.get(userId)
  if (!user) loadUser(userId)
  return user
}

function inDocument(
  published: string,
  sessionMap: Map<string, Session>,
  userMap: Map<string, User>,
): Present[] {
  const present: Present[] = []
  for (const session of sessionMap.values()) {
    const user = userMap.get(session.userId)
    // Sessions whose user profile hasn't loaded wait for it, like the JS store leaves out
    // sessions without a user.
    if (!user) continue
    for (const item of session.locations) {
      if (publishedId(item.documentId) !== published) continue
      present.push({
        sessionId: session.sessionId,
        user,
        hue: userHue(user.id, currentUser),
        location: item,
      })
    }
  }
  return present.toSorted((a, b) =>
    a.sessionId < b.sessionId ? -1 : a.sessionId > b.sessionId ? 1 : 0,
  )
}

/** Everyone else in the document `published`. */
export function useDocumentPresence(published: string): Present[] {
  const sessionMap = useSyncExternalStore(sessions.subscribe, sessions.get)
  const userMap = useSyncExternalStore(users.subscribe, users.get)
  return inDocument(published, sessionMap, userMap)
}

/** The other sessions in the field at `path`: anywhere inside it, or only at the field itself
 * for an object, whose fields show their own. */
export function useFieldPresence(published: string, path: Path, exact: boolean): Present[] {
  return useDocumentPresence(published).filter((present) =>
    exact ? samePath(present.location.path, path) : pathStartsWith(present.location.path, path),
  )
}

/** Overlapping avatars of the users present, at most three and a count of the rest, like the
 * JS studio's `AvatarStack`. */
export function PresenceAvatars(props: {present: Present[]; size?: 0 | 1 | 2}) {
  const seen = new Set<string>()
  const unique = props.present.filter((present) => {
    if (seen.has(present.user.id)) return false
    seen.add(present.user.id)
    return true
  })
  if (unique.length === 0) return null
  const rest = unique.length - 3
  return (
    <div
      data-testid="presence-avatars"
      style={{display: 'flex', alignItems: 'center', flex: 'none'}}
    >
      {unique.slice(0, 3).map((present, index) => (
        <div
          key={present.user.id}
          style={index === 0 ? undefined : {marginLeft: -4}}
          data-presence-user={present.user.id}
        >
          <Avatar
            src={present.user.image}
            initials={initials(present.user.name)}
            color={present.hue}
            size={props.size ?? 0}
            title={present.user.name}
          />
        </div>
      ))}
      {rest > 0 ? (
        <span style={{marginLeft: 4, fontSize: '0.6875rem', color: 'var(--card-muted-fg-color)'}}>
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
