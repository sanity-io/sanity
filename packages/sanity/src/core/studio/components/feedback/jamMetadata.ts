import {SANITY_VERSION} from '../../../version'

/**
 * Sets Jam metadata on `window.__jam__.exports.metadata` so the
 * Jam site script can read it when a recording is captured.
 * Must be called before opening the recorder link.
 *
 * @internal
 */
export function setJamMetadata(context: Record<string, unknown>): void {
  const win = window as unknown as Record<string, unknown>

  if (!win.__jam__ || typeof win.__jam__ !== 'object') {
    win.__jam__ = {}
  }
  const jam = win.__jam__ as Record<string, unknown>

  if (!jam.exports || typeof jam.exports !== 'object') {
    jam.exports = {}
  }
  const exports = jam.exports as Record<string, unknown>

  exports.metadata = () => ({
    source: 'sanity-studio',
    studioUrl: window.location.href,
    studioVersion: SANITY_VERSION,
    ...context,
  })
}
