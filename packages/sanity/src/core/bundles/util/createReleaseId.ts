import {customAlphabet} from 'nanoid'

/**
 * ~24 years (or 7.54e+8 seconds) needed, in order to have a 1% probability of at least one collision if 10 ID's are generated every hour.
 */
const createBundleId = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8,
)

/**
 * Create a unique release id. This is used as the bundle id for documents included in the release.
 * @internal
 */
export function createReleaseId() {
  return `r${createBundleId()}`
}
