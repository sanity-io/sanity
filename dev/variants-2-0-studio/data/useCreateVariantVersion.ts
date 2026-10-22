import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'
import {
  isDraftPerspective,
  type ReleaseId,
  type TargetPerspective,
  useDocumentVersions,
  usePerspective,
  useVariantDocumentOperations,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useVersionOperations} from '../../../packages/sanity/src/core/releases/hooks/useVersionOperations'
import {useAllVariants} from '../../../packages/sanity/src/core/variants/store/useAllVariants'
import {findVariantCreateBaseDocument} from '../../../packages/sanity/src/structure/panes/document/documentPanel/banners/findVariantCreateBaseDocument'

export type CreateVariantVersionStatus = 'idle' | 'creating' | 'created' | 'failed'

/** A document to copy: an existing version of this document. */
export interface CreateBase {
  _id: string
  _rev?: string
}

export interface CreateVariantVersionOptions {
  /** The variant, by its short id (without `_.variants.`). Left out: the chosen variant. */
  variantId?: string
  /** Where the version goes: Drafts or a release. Left out: the perspective the studio shows. */
  perspective?: TargetPerspective
  /** The version to copy. Left out: core's rule (the variant's drafts or published sibling, else the document the pane shows). */
  base?: CreateBase
}

/** The version list (`data/useVersionList`) refetches on window focus: once now, once when the new version has had time to be listed. */
function refetchVersions() {
  window.dispatchEvent(new Event('focus'))
  setTimeout(() => window.dispatchEvent(new Event('focus')), 1500)
}

/**
 * Creates a version of the open document. ONE implementation for the T6 banner and the inventory's Create version.
 * - A variant version, the way core's own "not in variant" banner does (DocumentNotInVariantBanner): core's `useVariantDocumentOperations`
 *   sends `sanity.action.document.variant.create`, copying `base` or else the base `findVariantCreateBaseDocument` picks. A live-edit document
 *   has no drafts, so in Drafts its variant version is made of Published.
 * - A base version into a release (`createBaseVersion`): core's `useVersionOperations().createVersion`, as core's Copy version to does
 *   (`sanity.action.document.version.create`), without its navigation.
 * Nothing navigates here: the caller does, or stays. The version list is asked to refetch. A failure is a toast, and the call returns false.
 */
export function useCreateVariantVersion(documentId: string) {
  const {value, schemaType} = useDocumentPane()
  // The router's variant is the open beta's only copy of the choice, so core's selected variant is the chosen one.
  const {selectedPerspective, selectedVariant} = usePerspective()
  const {versions} = useDocumentVersions({documentId})
  const {createVariantDocument} = useVariantDocumentOperations()
  const {createVersion} = useVersionOperations()
  const {data: allVariants} = useAllVariants()
  const toast = useToast()
  const [status, setStatus] = useState<CreateVariantVersionStatus>('idle')

  const run = useCallback(
    async (send: () => Promise<unknown>) => {
      setStatus('creating')
      try {
        await send()
        setStatus('created')
        refetchVersions()
        return true
      } catch (err) {
        setStatus('failed')
        toast.push({
          closable: true,
          description: err instanceof Error ? err.message : String(err),
          status: 'error',
          title: 'Could not create the version',
        })
        return false
      }
    },
    [toast],
  )

  const create = useCallback(
    async (options: CreateVariantVersionOptions = {}) => {
      const variant = options.variantId
        ? allVariants.find((v) => v._id === `_.variants.${options.variantId}`)
        : selectedVariant
      if (!variant) return false
      const target = options.perspective ?? selectedPerspective
      const perspective = schemaType?.liveEdit && isDraftPerspective(target) ? 'published' : target
      return run(async () => {
        if (options.base || value._createdAt) {
          const base =
            options.base ??
            findVariantCreateBaseDocument({
              variant,
              documentVersions: versions,
              fallback: {_id: value._id, _rev: value._rev},
            })
          await createVariantDocument({
            baseId: base._id,
            ifBaseRevisionId: base._rev,
            documentGroupId: documentId,
            variant,
            selectedPerspective: perspective,
          })
        } else {
          // Never saved: there is no base to copy, so the pane's value is the new version's content.
          const {_id, _rev, _createdAt, _updatedAt, _system, ...document} = value
          void [_id, _rev, _createdAt, _updatedAt, _system]
          await createVariantDocument({
            document,
            documentGroupId: documentId,
            variant,
            selectedPerspective: perspective,
          })
        }
      })
    },
    [
      allVariants,
      createVariantDocument,
      documentId,
      run,
      schemaType?.liveEdit,
      selectedPerspective,
      selectedVariant,
      value,
      versions,
    ],
  )

  const createBaseVersion = useCallback(
    (releaseId: ReleaseId, base: CreateBase) =>
      run(() => createVersion(releaseId, base._id, {navigate: false})),
    [createVersion, run],
  )

  return {create, createBaseVersion, status}
}
