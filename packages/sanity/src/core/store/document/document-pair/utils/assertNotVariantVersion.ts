import {type SanityDocument} from '@sanity/types'

/** @internal */
export const VARIANT_VERSION_DISABLED = 'VARIANT_VERSION' as const

/** @internal */
export type VariantVersionDisabledReason = typeof VARIANT_VERSION_DISABLED

/**
 * Legacy transaction-based operations in `operations/` are not supported for variant-scoped
 * versions. Variant documents route through `serverOperations/` and the variant document actions.
 *
 * @internal
 */
export function disabledForVariantVersion(
  version: SanityDocument | null | undefined,
): VariantVersionDisabledReason | false {
  if (version?._system?.variant?._ref) {
    return VARIANT_VERSION_DISABLED
  }
  return false
}

/**
 * Corruption tripwire: the base/release document actions must never run against a variant-scoped
 * version. A base publish with a variant version in the `draftId` slot would publish variant
 * content INTO the base published document — data corruption, not a broken button. Operations
 * route variant versions to the variant document actions before reaching the base paths; this
 * assert is insurance that stays correct independently of that routing (e.g. through future
 * refactors or new call sites).
 *
 * @internal
 */
export function assertNotVariantVersion(
  version: SanityDocument | null | undefined,
  operationName: string,
): void {
  if (version?._system?.variant?._ref) {
    throw new Error(
      `Cannot execute the base "${operationName}" operation against the variant-scoped version "${version._id}": this would write variant content into the base document. This is a bug in the operation routing — please report it.`,
    )
  }
}
