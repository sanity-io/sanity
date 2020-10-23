import {Observable} from 'rxjs'
import {filter, shareReplay} from 'rxjs/operators'
import {color as SanityColor, ColorHueKey, COLOR_HUES} from '@sanity/color'
import {UserColorHue, UserColorManager, UserColor, UserId} from './types'

export interface UserColorManagerOptions {
  anonymousColor?: UserColor
  userStore?: {currentUser: Observable<{type: 'snapshot' | 'error'; user?: {id: string} | null}>}
  colors?: Readonly<Record<UserColorHue, UserColor>>
  currentUserColor?: UserColorHue
}

const defaultCurrentUserHue: ColorHueKey = 'purple'

// Remove green and red because they can be confused with "add" and "remove"
// Remove gray because it looks like "color not found"
const defaultHues: ColorHueKey[] = COLOR_HUES.filter(
  (hue) => hue !== 'green' && hue !== 'red' && hue !== 'gray'
)

const defaultColors = defaultHues.reduce((colors, hue) => {
  colors[hue] = {
    background: SanityColor[hue][100].hex,
    border: SanityColor[hue][300].hex,
    text: SanityColor[hue][700].hex,
    tints: SanityColor[hue],
  }
  return colors
}, {} as Record<ColorHueKey, UserColor>)

const defaultAnonymousColor: UserColor = {
  background: SanityColor.gray[100].hex,
  border: SanityColor.gray[300].hex,
  text: SanityColor.gray[700].hex,
  tints: SanityColor.gray,
}

export function createUserColorManager(options?: UserColorManagerOptions): UserColorManager {
  const userColors = (options && options.colors) || defaultColors
  const anonymousColor = options?.anonymousColor || defaultAnonymousColor
  const currentUserColor = (options && options.currentUserColor) || defaultCurrentUserHue
  if (!userColors.hasOwnProperty(currentUserColor)) {
    throw new Error(`'colors' must contain 'currentUserColor' (${currentUserColor})`)
  }

  const colorHues: UserColorHue[] = Object.keys(userColors)
  const subscriptions = new Map<UserId, Observable<UserColor>>()
  const previouslyAssigned = new Map<UserId, UserColorHue>()
  const assignedCounts: Record<UserColorHue, number> = colorHues.reduce((counts, color) => {
    counts[color] = 0
    return counts
  }, {} as Record<UserColorHue, number>)

  // This isn't really needed because we're reusing subscriptions,
  // but is useful for debugging and poses a minimal overhead
  const assigned = new Map<UserId, UserColorHue>()

  let currentUserId: UserId | null

  if (options?.userStore) {
    options.userStore.currentUser
      .pipe(filter((evt) => evt.type === 'snapshot'))
      .subscribe((evt) => setCurrentUser(evt.user ? evt.user.id : null))
  }

  return {get, listen}

  function get(userId: UserId | null): UserColor {
    if (!userId) {
      return anonymousColor
    }

    return userColors[getUserHue(userId)]
  }

  function getUserHue(userId: UserId): UserColorHue {
    if (userId === currentUserId) {
      return currentUserColor
    }

    const assignedHue = assigned.get(userId)
    if (assignedHue) {
      return assignedHue
    }

    // Prefer to reuse the color previously assigned, BUT:
    // ONLY if it's unused -or- there are no other unused colors
    const prevHue = previouslyAssigned.get(userId)
    if (prevHue && (assignedCounts[prevHue] === 0 || !hasUnusedColor())) {
      return assignHue(userId, prevHue)
    }

    // Prefer "static" color based on user ID if unused
    const preferredHue = getPreferredHue(userId)
    if (assignedCounts[preferredHue] === 0) {
      return assignHue(userId, preferredHue)
    }

    // Fall back to least used color, with a preference on the previous
    // used color if there are ties for least used
    return assignHue(userId, getLeastUsedHue(prevHue))
  }

  function listen(userId: string): Observable<UserColor> {
    let subscription = subscriptions.get(userId)
    if (subscription) {
      return subscription
    }

    const hue = getUserHue(userId)
    subscription = getObservableColor(userId, hue)
    subscriptions.set(userId, subscription)
    return subscription
  }

  function assignHue(userId: string, hue: UserColorHue): UserColorHue {
    assigned.set(userId, hue)
    previouslyAssigned.set(userId, hue)
    assignedCounts[hue]++
    return hue
  }

  function unassignHue(userId: string, hue: UserColorHue) {
    assigned.delete(userId)
    assignedCounts[hue]--
  }

  function getUnusedColor(): UserColorHue | undefined {
    return colorHues.find((colorHue) => assignedCounts[colorHue] === 0)
  }

  function hasUnusedColor(): boolean {
    return Boolean(getUnusedColor())
  }

  function getLeastUsedHue(tieBreakerPreference?: UserColorHue): UserColorHue {
    let leastUses = +Infinity
    let leastUsed: UserColorHue[] = []

    colorHues.forEach((colorHue) => {
      const uses = assignedCounts[colorHue]
      if (uses === leastUses) {
        leastUsed.push(colorHue)
      } else if (uses < leastUses) {
        leastUses = uses
        leastUsed = [colorHue]
      }
    })

    return tieBreakerPreference && leastUsed.includes(tieBreakerPreference)
      ? tieBreakerPreference
      : leastUsed[0]
  }

  function getObservableColor(userId: string, hue: UserColorHue): Observable<UserColor> {
    return new Observable<UserColor>((subscriber) => {
      const userColor = userColors[hue]
      subscriber.next(userColor)
      return () => {
        subscriptions.delete(userId)
        unassignHue(userId, hue)
      }
    }).pipe(shareReplay({refCount: true}))
  }

  function setCurrentUser(userId: string | null) {
    currentUserId = userId
    assignedCounts[currentUserColor] += userId ? 1 : -1
  }

  function getPreferredHue(userId: string): UserColorHue {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      // eslint-disable-next-line no-bitwise
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
    }
    return colorHues[Math.abs(hash) % colorHues.length]
  }
}
