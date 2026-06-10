// Mimics the implementation from createReleaseId.ts
import {customAlphabet} from 'nanoid'

import {VARIANT_DOCUMENTS_PATH} from '../store/constants'

/**
 * ~24 years (or 7.54e+8 seconds) needed, in order to have a 1% probability of at least one collision if 10 ID's are generated every hour.
 */
const createVariantIdSuffix = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8,
)

/**
 * Create a unique system variant document id.
 *
 * @internal
 */
export function createVariantId(): `${typeof VARIANT_DOCUMENTS_PATH}.${string}` {
  return `${VARIANT_DOCUMENTS_PATH}.${createVariantIdSuffix()}`
}
