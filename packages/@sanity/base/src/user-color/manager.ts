import {Observable} from 'rxjs'
import {filter, shareReplay} from 'rxjs/operators'
import {color as SanityColor, ColorHueKey, COLOR_HUES} from '@sanity/color'
import {UserColorHue, ManagerOptions, UserColorManager, UserColor} from './types'

type UserId = string

const defaultCurrentUserHue = 'blue'

// Remove green and red because they can be confused with "add" and "remove"
const defaultHues: ColorHueKey[] = COLOR_HUES.filter(hue => hue !== 'green' && hue !== 'red')
const defaultColors = defaultHues.reduce((colors, hue) => {
  colors[hue] = {
    background: SanityColor[hue][100].hex,
    border: SanityColor[hue][300].hex,
    text: SanityColor[hue][700].hex
  }
  return colors
}, {} as Record<ColorHueKey, UserColor>)

export function createUserColorManager(options?: ManagerOptions): UserColorManager {
  const colors = (options && options.colors) || defaultColors
  const currentUserColor = (options && options.currentUserColor) || defaultCurrentUserHue
  if (!colors.hasOwnProperty(currentUserColor)) {
    throw new Error(`'colors' must contain 'currentUserColor' (${currentUserColor})`)
  }

  const colorHues: UserColorHue[] = Object.keys(colors)
  const subscriptions = new Map<UserId, Observable<UserColor>>()
  const previouslyAssigned = new Map<UserId, UserColorHue>()
  const assignedCounts: Record<UserColorHue, number> = colorHues.reduce((counts, color) => {
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

  return {get, listen}

  function get(userId: string): UserColor {
    return colors[getUserHue(userId)]
  }

  function getUserHue(userId: string): UserColorHue {
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
    return colorHues.find(color => assignedCounts[color] === 0)
  }

  function hasUnusedColor(): boolean {
    return Boolean(getUnusedColor())
  }

  function getLeastUsedHue(tieBreakerPreference?: UserColorHue): UserColorHue {
    let leastUses = +Infinity
    let leastUsed: UserColorHue[] = []

    colorHues.forEach(color => {
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

  function getObservableColor(userId: string, hue: UserColorHue): Observable<UserColor> {
    return new Observable<UserColor>(subscriber => {
      const color = colors[hue]
      subscriber.next(color)
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
