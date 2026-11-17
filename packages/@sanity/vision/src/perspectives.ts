import {type ClientPerspective} from '@sanity/client'
import {type PerspectiveContextValue, type PerspectiveStack} from 'sanity'

export const SUPPORTED_PERSPECTIVES = [
  'pinnedRelease',
  'scheduledDrafts',
  'raw',
  'published',
  'drafts',
] as const

export type SupportedPerspective = (typeof SUPPORTED_PERSPECTIVES)[number]

/**
 * Virtual perspectives are recognised by Vision, but do not concretely reflect the names of real
 * perspectives. Virtual perspectives are transformed into real perspectives before being used to
 * interact with data.
 *
 * For example, the `pinnedRelease` virtual perspective is transformed to the real perspective
 * currently pinned in Studio, and `scheduledDrafts` is transformed to a stack of all scheduled
 * draft release IDs.
 */
export const VIRTUAL_PERSPECTIVES = ['pinnedRelease', 'scheduledDrafts'] as const

export type VirtualPerspective = (typeof VIRTUAL_PERSPECTIVES)[number]

export function isSupportedPerspective(p: string): p is SupportedPerspective {
  return SUPPORTED_PERSPECTIVES.includes(p as SupportedPerspective)
}

export function isVirtualPerspective(
  maybeVirtualPerspective: unknown,
): maybeVirtualPerspective is VirtualPerspective {
  return (
    typeof maybeVirtualPerspective === 'string' &&
    VIRTUAL_PERSPECTIVES.includes(maybeVirtualPerspective as VirtualPerspective)
  )
}

export function hasPinnedPerspective({selectedPerspectiveName}: PerspectiveContextValue): boolean {
  return typeof selectedPerspectiveName !== 'undefined'
}

export function getActivePerspective({
  visionPerspective,
  perspectiveStack,
  scheduledDraftsStack,
}: {
  visionPerspective: ClientPerspective | SupportedPerspective | undefined
  perspectiveStack: PerspectiveContextValue['perspectiveStack']
  scheduledDraftsStack?: PerspectiveStack
}): ClientPerspective | undefined {
  if (visionPerspective === 'pinnedRelease') {
    return perspectiveStack
  }
  if (visionPerspective === 'scheduledDrafts') {
    return scheduledDraftsStack
  }
  return visionPerspective
}

/**
 * The navbar variant is only sent with Vision queries when the virtual "Pinned release"
 * perspective is selected. Other Vision perspectives stay local and do not attach a variant.
 */
export function getActiveVariant(
  visionPerspective: ClientPerspective | SupportedPerspective | undefined,
  selectedVariantName: string | undefined,
): string | undefined {
  if (visionPerspective !== 'pinnedRelease') {
    return undefined
  }
  return selectedVariantName
}
