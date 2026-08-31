import {type SchemaType} from '@sanity/types'
import {type EditStateFor, type TargetPerspective, type Workspace} from 'sanity'

import {isLiveEditEnabled} from './components/paneItem/helpers'

export interface ShouldShowSeeDraftBannerContext {
  selectedPerspective: TargetPerspective
  schemaType?: Pick<SchemaType, 'liveEdit'>
  workspace: {
    document: {
      drafts: Pick<Workspace['document']['drafts'], 'enabled'>
    }
  }
  editState: Pick<EditStateFor, 'ready' | 'draft' | 'published'> | null
  isHistoryRevision?: boolean
}

/**
 * Show the "See draft" banner when a published-only, non-live-edit document is
 * viewed in the published perspective. The banner switches to the drafts
 * perspective; it does not create a draft document.
 *
 * Live-edit documents are editable in published and must never show this banner.
 */
export function shouldShowSeeDraftBanner({
  selectedPerspective,
  schemaType,
  workspace,
  editState,
  isHistoryRevision = false,
}: ShouldShowSeeDraftBannerContext): boolean {
  if (!editState?.ready || isHistoryRevision) {
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

  // Published-only: a published document exists and there is no draft to open.
  return Boolean(editState.published) && !editState.draft
}
