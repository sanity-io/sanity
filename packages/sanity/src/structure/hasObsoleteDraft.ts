import {type SchemaType} from '@sanity/types'
import {type Workspace, type TargetDocumentState} from 'sanity'

import {isLiveEditEnabled} from './components/paneItem/helpers'

export interface Context {
  targetDocumentState: TargetDocumentState | undefined
  workspace: {
    document: {
      drafts: Pick<Workspace['document']['drafts'], 'enabled'>
    }
  }
  schemaType: Pick<SchemaType, 'liveEdit'>
}

/**
 * Determine whether a document has an obsolete draft. This occurs if a document has a draft while
 * the draft model is inactive, or if a live-edit document has a draft (base or variant-scoped).
 */
export function hasObsoleteDraft({targetDocumentState, workspace, schemaType}: Context):
  | {
      result: true
      reason: 'LIVE_EDIT_ACTIVE' | 'DRAFT_MODEL_INACTIVE'
    }
  | {result: false}
  | {result: undefined} {
  if (
    targetDocumentState?.status === 'resolving' ||
    targetDocumentState?.status === 'variant-definition-document-not-found'
  ) {
    return {
      result: undefined,
    }
  }

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = workspace

  if (!targetDocumentState?.siblings.draft) {
    return {
      result: false,
    }
  }

  if (!isDraftModelEnabled) {
    return {
      result: true,
      reason: 'DRAFT_MODEL_INACTIVE',
    }
  }

  if (isLiveEditEnabled(schemaType)) {
    return {
      result: true,
      reason: 'LIVE_EDIT_ACTIVE',
    }
  }

  return {
    result: false,
  }
}
