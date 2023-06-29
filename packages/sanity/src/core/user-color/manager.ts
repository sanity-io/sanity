import {Observable} from 'rxjs'
import {shareReplay} from 'rxjs/operators'
import {hues, ColorHueKey, COLOR_HUES, ColorTintKey} from '@sanity/color'
import {ThemeColorSchemeKey} from '@sanity/ui'
import {UserColorHue, UserColorManager, UserColor, UserId} from './types'

/** @internal */
export interface UserColorManagerOptions {
  anonymousColor?: UserColor
  userStore?: {me: Observable<{id: string} | null>}
  colors?: Record<UserColorHue, UserColor>
  currentUserColor?: UserColorHue
  scheme: ThemeColorSchemeKey
}

const DEFAULT_CURRENT_USER_HUE: ColorHueKey = 'purple'

// Exclude green and red because they can be confused with "add" and "remove"
// Exclude gray because it looks like "color not found"
const USER_COLOR_EXCLUDE_HUES = ['green', 'red', 'gray']

const defaultHues: ColorHueKey[] = COLOR_HUES.filter(
  (hue) => !USER_COLOR_EXCLUDE_HUES.includes(hue)
)

const getTints = (scheme: ThemeColorSchemeKey): Record<string, ColorTintKey> => {
  const isDarkScheme = scheme === 'dark'

  return {
    background: isDarkScheme ? '900' : '100',
    border: isDarkScheme ? '700' : '300',
    text: isDarkScheme ? '200' : '700',
  }
}

const getDefaultColors = (scheme: ThemeColorSchemeKey): Record<string, UserColor> => {
  const {background, border, text} = getTints(scheme)

  return defaultHues.reduce((colors, hue) => {
    colors[hue] = {
      name: hue,
      background: hues[hue][background].hex,
      border: hues[hue][border].hex,
      text: hues[hue][text].hex,
      tints: hues[hue],
    }
    return colors
  }, {} as Record<ColorHueKey, UserColor>)
}

const getAnonymousColor = (scheme: ThemeColorSchemeKey): UserColor => {
  const {background, border, text} = getTints(scheme)

  return {
    name: 'gray',
    background: hues.gray[background].hex,
    border: hues.gray[border].hex,
    text: hues.gray[text].hex,
    tints: hues.gray,
  }
}

/** @internal */
export function createUserColorManager(options: UserColorManagerOptions): UserColorManager {
  const {
    anonymousColor: anonymousColorProp,
    colors,
    currentUserColor: currentUserColorProp,
    scheme,
  } = options

  const userColors = colors || getDefaultColors(scheme)
  const anonymousColor = anonymousColorProp || getAnonymousColor(scheme)
  const currentUserColor = currentUserColorProp || DEFAULT_CURRENT_USER_HUE

  if (!userColors.hasOwnProperty(currentUserColor)) {
    throw new Error(`'colors' must contain 'currentUserColor' (${currentUserColor})`)
  }

  const userColorKeys: UserColorHue[] = Object.keys(userColors)
  const subscriptions = new Map<UserId, Observable<UserColor>>()
  const previouslyAssigned = new Map<UserId, UserColorHue>()
  const assignedCounts: Record<UserColorHue, number> = userColorKeys.reduce((counts, color) => {
    counts[color] = 0
    return counts
  }, {} as Record<UserColorHue, number>)

  // This isn't really needed because we're reusing subscriptions,
  // but is useful for debugging and poses a minimal overhead
  const assigned = new Map<UserId, UserColorHue>()

  let currentUserId: UserId | null

  if (options?.userStore) {
    options.userStore.me.subscribe((user) => setCurrentUser(user ? user.id : null))
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
    return userColorKeys.find((colorHue) => assignedCounts[colorHue] === 0)
  }

  function hasUnusedColor(): boolean {
    return Boolean(getUnusedColor())
  }

  function getLeastUsedHue(tieBreakerPreference?: UserColorHue): UserColorHue {
    let leastUses = +Infinity
    let leastUsed: UserColorHue[] = []

    userColorKeys.forEach((colorHue) => {
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
    return userColorKeys[Math.abs(hash) % userColorKeys.length]
  }
}
