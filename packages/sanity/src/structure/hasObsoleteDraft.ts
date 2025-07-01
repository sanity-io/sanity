import {type SchemaType} from '@sanity/types'
import {type EditStateFor, type Workspace} from 'sanity'

import {isLiveEditEnabled} from './components/paneItem/helpers'

export interface Context {
  editState: Pick<EditStateFor, 'ready' | 'draft' | 'published' | 'version'> | null
  workspace: {
    document: {
      drafts: Pick<Workspace['document']['drafts'], 'enabled'>
    }
  }
  schemaType: Pick<SchemaType, 'liveEdit'>
}

/**
 * Determine whether a document has an obsolete draft. This occurs if a document has a draft while
 * the draft model is inactive, or if a live-edit document has a draft.
 */
export function hasObsoleteDraft({editState, workspace, schemaType}: Context):
  | {
      result: true
      reason: 'LIVE_EDIT_ACTIVE' | 'DRAFT_MODEL_INACTIVE'
    }
  | {result: false}
  | {result: undefined} {
  if (!editState?.ready) {
    return {
      result: undefined,
    }
  }

  const draftExists = editState.draft !== null

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = workspace

  if (draftExists === false) {
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
