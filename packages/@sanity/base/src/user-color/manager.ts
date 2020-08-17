import {Observable} from 'rxjs'
import {filter, shareReplay} from 'rxjs/operators'
import {UserColorHue, ManagerOptions} from './types'

type UserId = string

const defaultCurrentUserColor = 'yellow'
const defaultColors: UserColorHue[] = [
  'blue',
  'cyan',
  // 'green',
  'yellow',
  'orange',
  // 'red',
  'magenta',
  'purple'
]

export function createUserColorManager(options?: ManagerOptions) {
  const colors = (options && options.colors) || defaultColors
  const currentUserColor = (options && options.currentUserColor) || defaultCurrentUserColor
  if (!colors.includes(currentUserColor)) {
    throw new Error(`'colors' must contain 'currentUserColor' (${currentUserColor})`)
  }

  const subscriptions = new Map<UserId, Observable<UserColorHue>>()
  const previouslyAssigned = new Map<UserId, UserColorHue>()
  const assignedCounts: Record<UserColorHue, number> = colors.reduce((counts, color) => {
    counts[color] = 0
    return counts
  }, {} as Record<UserColorHue, number>)

  // This isn't really needed because we're reusing subscriptions,
  // but is useful for debugging and poses a minimal overhead
  const assigned = new Map<UserId, UserColorHue>()

  let currentUserId: string | null

  if (options?.userStore) {
    options.userStore.currentUser
      .pipe(filter(evt => evt.type === 'snapshot'))
      .subscribe(evt => setCurrentUser(evt.user ? evt.user.id : null))
  }

  return {get}

  function get(userId: string): Observable<UserColorHue> {
    if (subscriptions.has(userId)) {
      return subscriptions.get(userId)
    }

    const color = getUserColor(userId)
    const subscription = getObservableColor(userId, color)
    subscriptions.set(userId, subscription)
    return subscription
  }

  function getUserColor(userId: string): UserColorHue {
    if (userId === currentUserId) {
      return currentUserColor
    }

    if (assigned.has(userId)) {
      return assigned.get(userId)
    }

    // Prefer to reuse the color previously assigned, BUT:
    // ONLY if it's unused -or- there are no other unused colors
    const prevColor = previouslyAssigned.get(userId)
    if (prevColor && (assignedCounts[prevColor] === 0 || !hasUnusedColor())) {
      return assignColor(userId, prevColor)
    }

    // Prefer "static" color based on user ID if unused
    const preferredColor = getPreferredColor(userId)
    if (assignedCounts[preferredColor] === 0) {
      return assignColor(userId, preferredColor)
    }

    // Fall back to least used color, with a preference on the previous
    // used color if there are ties for least used
    return assignColor(userId, getLeastUsedColor(prevColor))
  }

  function assignColor(userId: string, color: UserColorHue): UserColorHue {
    assigned.set(userId, color)
    previouslyAssigned.set(userId, color)
    assignedCounts[color]++
    return color
  }

  function unassignColor(userId: string, color: UserColorHue) {
    assigned.delete(userId)
    assignedCounts[color]--
  }

  function getUnusedColor(): UserColorHue | undefined {
    return colors.find(color => assignedCounts[color] === 0)
  }

  function hasUnusedColor(): boolean {
    return Boolean(getUnusedColor())
  }

  function getLeastUsedColor(tieBreakerPreference?: UserColorHue): UserColorHue {
    let leastUses = +Infinity
    let leastUsed: UserColorHue[] = []

    colors.forEach(color => {
      const uses = assignedCounts[color]
      if (uses === leastUses) {
        leastUsed.push(color)
      } else if (uses < leastUses) {
        leastUses = uses
        leastUsed = [color]
      }
    })

    return tieBreakerPreference && leastUsed.includes(tieBreakerPreference)
      ? tieBreakerPreference
      : leastUsed[0]
  }

  function getObservableColor(userId: string, color: UserColorHue): Observable<UserColorHue> {
    return new Observable<UserColorHue>(subscriber => {
      subscriber.next(color)
      return () => {
        subscriptions.delete(userId)
        unassignColor(userId, color)
      }
    }).pipe(shareReplay({refCount: true}))
  }

  function setCurrentUser(userId: string | null) {
    currentUserId = userId
    assignedCounts[currentUserColor] += userId ? 1 : -1
  }

  function getPreferredColor(userId: string): UserColorHue {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      // eslint-disable-next-line no-bitwise
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
    }
    return colors[Math.abs(hash) % colors.length]
  }
}
