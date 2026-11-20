import {type ReleasePropertyComponent} from '../../../../config/releases/properties'

const warnedMessages = new WeakMap<ReleasePropertyComponent, Set<string>>()

/** Logs a development warning about a release property, once per property and message. */
export function warnOncePerProperty(property: ReleasePropertyComponent, message: string): void {
  if (process.env.NODE_ENV === 'production') return

  const warned = warnedMessages.get(property) ?? new Set<string>()
  if (warned.has(message)) return

  warned.add(message)
  warnedMessages.set(property, warned)
  console.warn(`[releases.properties] ${message}`)
}
