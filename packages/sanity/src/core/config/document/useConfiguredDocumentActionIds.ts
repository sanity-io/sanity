import {useMemo} from 'react'

import {useSource} from '../../studio/source'
import {
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type PartialContext,
} from '../types'
import {type DocumentActionKeys} from './actions'
import {resolveDocumentActionIds} from './bulkDocumentActions'

const NO_ACTION_IDS: ReadonlySet<keyof DocumentActionKeys> = new Set()

/**
 * Resolves the set of configured document action identifiers for a given
 * document context. Reflects `document.actions` filtering from the studio
 * config (and plugins), so callers can hide surfaces that mirror those
 * actions — for example the version chip / document group inventory context menu.
 *
 * @internal
 */
export function useConfiguredDocumentActionIds(
  context: PartialContext<DocumentActionsContext> | null,
): ReadonlySet<keyof DocumentActionKeys> {
  // oxlint-disable-next-line no-deprecated -- deprecated for external consumers; the document pane resolves document.actions from this same source instance
  const source = useSource()
  const resolveDocumentActions = source.document.actions

  const schemaType = context?.schemaType
  const documentId = context?.documentId
  const versionType = context?.versionType
  const releaseId = context?.releaseId

  return useMemo(() => {
    // Resolving without an identity would hand a `ctx.schemaType` predicate an undefined value.
    if (schemaType === undefined || versionType === undefined) return NO_ACTION_IDS

    return resolveDocumentActionIds(
      resolveDocumentActions({
        schemaType,
        documentId,
        versionType,
        releaseId,
      }),
    )
  }, [schemaType, documentId, versionType, releaseId, resolveDocumentActions])
}

/**
 * Resolves the document-actions version type from pane or chip flags.
 *
 * Callers pass `isScheduledDraft`. Do not look the release up here: the chip's
 * `releases` prop is notCurrentReleases and the chip's own release is absent from it.
 *
 * @internal
 */
export function getDocumentVersionType(options: {
  isRevision?: boolean
  isScheduledDraft?: boolean
  isVersionDocument?: boolean
  perspectiveName?: string
  draftsEnabled?: boolean
}): DocumentActionsVersionType {
  const {
    isRevision = false,
    isScheduledDraft = false,
    isVersionDocument = false,
    perspectiveName,
    draftsEnabled = false,
  } = options

  if (isRevision) return 'revision'
  if (isScheduledDraft) return 'scheduled-draft'
  if (isVersionDocument) return 'version'
  if (perspectiveName === 'published') return 'published'
  if (draftsEnabled) return 'draft'
  return 'published'
}

function isReleaseBundleId(bundleId: string): boolean {
  return bundleId !== 'published' && bundleId !== 'draft'
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

  const isRelease = isReleaseBundleId(fromRelease)

  const versionType = getDocumentVersionType({
    isScheduledDraft,
    isVersionDocument: isRelease,
    perspectiveName: fromRelease,
    draftsEnabled: true,
  })

  const releaseId = isRelease ? fromRelease : undefined

  return {schemaType, documentId: documentGroupId, versionType, releaseId}
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

  if (fromRelease === 'published') return null
  if (fromRelease === 'draft') {
    return isScheduledDraft ? 'discardVersion' : 'discardChanges'
  }
  return 'discardVersion'
}
