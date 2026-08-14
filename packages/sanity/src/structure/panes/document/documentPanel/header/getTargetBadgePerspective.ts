import {type DocumentSystem} from '@sanity/types'
import {
  isDraftPerspective,
  isPublishedPerspective,
  isSystemBundle,
  type TargetDocumentState,
  type TargetPerspective,
} from 'sanity'

/**
 * A document (or version stub) that may carry `_system` metadata used to
 * distinguish published vs draft for live-edit badge labeling.
 */
export type BadgeSystemDocument = {
  _system?: Partial<DocumentSystem>
}

/**
 * Picks the document whose `_system` should drive the live-edit header badge:
 * the resolved target, the published variant sibling when the drafts-bundle
 * variant is missing, or the currently displayed document.
 */
export function getBadgeSystemDocument(
  state: TargetDocumentState,
  displayed: BadgeSystemDocument | null | undefined,
): BadgeSystemDocument | undefined {
  if (state.status === 'ready' && state.targetDocument) {
    return state.targetDocument
  }

  if (state.status === 'variant-missing' && state.publishedSibling) {
    return state.publishedSibling
  }

  return displayed ?? undefined
}

/**
 * Resolves the perspective the document-pane target badge should display.
 *
 * Non-live-edit documents mirror the selected perspective. Live-edit documents
 * in a system bundle (`drafts` / `published`) are classified from `_system.bundleId`
 * so a published live-edit doc is not labeled "Drafts" just because the studio
 * is pinned to the drafts perspective.
 */
export function getTargetBadgePerspective({
  isLiveEdit,
  selectedPerspective,
  document,
}: {
  isLiveEdit: boolean
  selectedPerspective: TargetPerspective
  document: BadgeSystemDocument | undefined
}): TargetPerspective {
  if (!isLiveEdit) {
    return selectedPerspective
  }

  if (!isDraftPerspective(selectedPerspective) && !isPublishedPerspective(selectedPerspective)) {
    return selectedPerspective
  }

  const bundleId = document?._system?.bundleId
  if (bundleId === 'drafts') {
    return 'drafts'
  }

  if (typeof bundleId === 'undefined') {
    return 'published'
  }

  return selectedPerspective
}

/**
 * Whether the target badge should appear dimmed (document does not exist in the
 * selected perspective). Live-edit documents in a system bundle (`drafts` /
 * `published`) that fall back to a published variant sibling are not treated as
 * missing. Release and agent bundles still dim when the variant is absent.
 */
export function isTargetBadgeMissing({
  isLiveEdit,
  state,
  bundle,
}: {
  isLiveEdit: boolean
  state: TargetDocumentState
  bundle: 'published' | 'drafts' | (string & {})
}): boolean {
  switch (state.status) {
    case 'resolving':
      return false
    case 'variant-definition-document-not-found':
      return true
    case 'variant-missing':
      return !(isLiveEdit && Boolean(state.publishedSibling) && isSystemBundle(bundle))
    case 'ready':
      return !state.targetDocument && !state.variant && !isSystemBundle(bundle)
    default:
      return false
  }
}
