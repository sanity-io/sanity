import {type SchemaType} from '@sanity/types'
import {type TargetPerspective, type VersionInfoDocumentStub, type Workspace} from 'sanity'

import {isLiveEditEnabled} from './components/paneItem/helpers'

export interface ShouldShowSeeDraftBannerContext {
  selectedPerspective: TargetPerspective
  schemaType?: Pick<SchemaType, 'liveEdit'>
  workspace: {
    document: {
      drafts: Pick<Workspace['document']['drafts'], 'enabled'>
    }
  }
  siblings: {published: VersionInfoDocumentStub | undefined} | undefined
  isHistoryRevision?: boolean
}

/**
 * Show the "See draft" banner when a non-live-edit document with a published sibling
 * is viewed in the published perspective. The banner switches to the drafts
 * perspective so the user can edit there (whether a draft already exists or not).
 *
 * Live-edit documents are editable in published and must never show this banner.
 */
export function shouldShowSeeDraftBanner({
  selectedPerspective,
  schemaType,
  workspace,
  siblings,
  isHistoryRevision = false,
}: ShouldShowSeeDraftBannerContext): boolean {
  if (!siblings || isHistoryRevision) {
    return false
  }

  if (selectedPerspective !== 'published') {
    return false
  }

  if (!schemaType || isLiveEditEnabled(schemaType)) {
    return false
  }

  if (!workspace.document.drafts.enabled) {
    return false
  }

  return Boolean(siblings.published)
}
