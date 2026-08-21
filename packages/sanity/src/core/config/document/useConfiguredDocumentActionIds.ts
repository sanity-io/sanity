import {useMemo} from 'react'

import {useSource} from '../../studio/source'
import {
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type PartialContext,
} from '../types'
import {type DocumentActionKeys} from './actions'

/**
 * Resolves the set of configured document action identifiers for a given
 * document context. Reflects `document.actions` filtering from the studio
 * config (and plugins), so callers can hide surfaces that mirror those
 * actions — for example the version chip / document group inventory context menu.
 *
 * @internal
 */
export function useConfiguredDocumentActionIds(
  context: PartialContext<DocumentActionsContext>,
): ReadonlySet<keyof DocumentActionKeys> {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const source = useSource()
  const resolveDocumentActions = source.document.actions

  const {schemaType, documentId, versionType, releaseId} = context

  return useMemo(() => {
    const configured = resolveDocumentActions({
      schemaType,
      documentId,
      versionType,
      releaseId,
    })
    const ids = new Set<keyof DocumentActionKeys>()

    for (const action of configured) {
      if (action.action) {
        ids.add(action.action)
      }
    }

    return ids
  }, [schemaType, documentId, versionType, releaseId, resolveDocumentActions])
}

/**
 * Derives the document-actions context for a version chip / inventory row
 * context menu from the chip's release identity.
 *
 * @internal
 */
export function getVersionContextMenuActionsContext(options: {
  schemaType: string
  documentGroupId: string
  fromRelease: string
  isScheduledDraft?: boolean
}): PartialContext<DocumentActionsContext> {
  const {schemaType, documentGroupId, fromRelease, isScheduledDraft = false} = options

  let versionType: DocumentActionsVersionType
  if (isScheduledDraft) {
    versionType = 'scheduled-draft'
  } else if (fromRelease === 'published') {
    versionType = 'published'
  } else if (fromRelease === 'draft') {
    versionType = 'draft'
  } else {
    versionType = 'version'
  }

  const releaseId = fromRelease === 'published' || fromRelease === 'draft' ? undefined : fromRelease

  return {
    schemaType,
    documentId: documentGroupId,
    versionType,
    releaseId,
  }
}

/**
 * The document action identifier that corresponds to discarding the version
 * represented by a context menu (draft discard vs version discard).
 *
 * @internal
 */
export function getDiscardDocumentActionId(options: {
  fromRelease: string
  isScheduledDraft?: boolean
}): keyof DocumentActionKeys | null {
  const {fromRelease, isScheduledDraft = false} = options

  if (fromRelease === 'published') {
    return null
  }

  if (fromRelease === 'draft' && !isScheduledDraft) {
    return 'discardChanges'
  }

  return 'discardVersion'
}
