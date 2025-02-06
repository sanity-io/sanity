export const SUPPORTED_PERSPECTIVES = ['pinnedRelease', 'raw', 'published', 'drafts'] as const

export type SupportedPerspective = (typeof SUPPORTED_PERSPECTIVES)[number]

/**
 * Virtual perspectives are recognised by Vision, but do not concretely reflect the names of real
 * perspectives. Virtual perspectives are transformed into real perspectives before being used to
 * interact with data.
 *
 * For example, the `pinnedRelease` virtual perspective is transformed to the real perspective
 * currently pinned in Studio.
 */
export const VIRTUAL_PERSPECTIVES = ['pinnedRelease'] as const

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
