import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'
import {
  isDraftPerspective,
  useDocumentVersions,
  usePerspective,
  useVariantDocumentOperations,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {findVariantCreateBaseDocument} from '../../../packages/sanity/src/structure/panes/document/documentPanel/banners/findVariantCreateBaseDocument'

export type CreateVariantVersionStatus = 'idle' | 'creating' | 'created' | 'failed'

/**
 * Creates the open document's version for the chosen variant, in the Drafts or release perspective the studio shows, the way core's own "not in variant" banner does
 * (DocumentNotInVariantBanner): core's `useVariantDocumentOperations` sends `sanity.action.document.variant.create`, copying the base that
 * `findVariantCreateBaseDocument` picks (the variant's drafts or published sibling, else the document the pane shows). A live-edit document
 * has no drafts, so in Drafts its variant version is made of Published. Nothing navigates: the perspective and the variant stay as they are,
 * and the version list is asked to refetch so the banner goes away. A failure is a toast.
 */
export function useCreateVariantVersion(documentId: string) {
  const {value, schemaType} = useDocumentPane()
  // The router's variant is the open beta's only copy of the choice, so core's selected variant is the chosen one.
  const {selectedPerspective, selectedVariant} = usePerspective()
  const {versions} = useDocumentVersions({documentId})
  const {createVariantDocument} = useVariantDocumentOperations()
  const toast = useToast()
  const [status, setStatus] = useState<CreateVariantVersionStatus>('idle')

  const create = useCallback(async () => {
    const variant = selectedVariant
    if (!variant) return
    const perspective =
      schemaType?.liveEdit && isDraftPerspective(selectedPerspective)
        ? 'published'
        : selectedPerspective
    setStatus('creating')
    try {
      if (value._createdAt) {
        const base = findVariantCreateBaseDocument({
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
      setStatus('created')
      // The version list refetches on window focus.
      window.dispatchEvent(new Event('focus'))
    } catch (err) {
      setStatus('failed')
      toast.push({
        closable: true,
        description: err instanceof Error ? err.message : String(err),
        status: 'error',
        title: 'Could not create the version',
      })
    }
  }, [
    createVariantDocument,
    documentId,
    schemaType?.liveEdit,
    selectedPerspective,
    selectedVariant,
    toast,
    value,
    versions,
  ])

  return {create, status}
}
