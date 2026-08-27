import {Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useState} from 'react'
import {
  getVariantTitle,
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseDocument,
  Translate,
  useConditionalToast,
  useDocumentVersions,
  useGetDefaultPerspective,
  usePerspective,
  useTranslation,
  useVariantDocumentOperations,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'
import {findVariantCreateBaseDocument} from './findVariantCreateBaseDocument'

// Once the create action resolves, there's a short delay before the new variant-scoped version
// propagates and this banner unmounts. Surface a toast if that window exceeds this threshold.
const TOAST_DELAY = 1000

type VariantDocumentCreateStatus = 'idle' | 'in-progress' | 'success' | 'failed'

export function DocumentNotInVariantBanner() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {value, documentId, schemaType} = useDocumentPane()
  const {selectedPerspective, selectedVariant, selectedReleaseId} = usePerspective()
  const {versions} = useDocumentVersions({documentId})

  const {createVariantDocument} = useVariantDocumentOperations()
  const [status, setStatus] = useState<VariantDocumentCreateStatus>('idle')
  const toast = useToast()
  const defaultPerspective = useGetDefaultPerspective()

  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : ''
  const perspectiveTitle = useMemo(() => {
    if (isReleaseDocument(selectedPerspective)) {
      return selectedPerspective.metadata?.title || tCore('release.placeholder-untitled-release')
    }

    if (isDraftPerspective(selectedPerspective)) {
      return tCore('release.chip.global.drafts')
    }

    if (isPublishedPerspective(selectedPerspective)) {
      return tCore('release.chip.published')
    }

    // Covers release ids (string) and other non-system bundle perspectives.
    return String(selectedPerspective)
  }, [selectedPerspective, tCore])

  const handleAddToVariant = useCallback(async () => {
    if (!selectedVariant) {
      return
    }

    setStatus('in-progress')
    try {
      if (!value._createdAt) {
        const {_id, _rev, _createdAt, _updatedAt, _system, ...document} = value
        // The document doesn't exists yet, so we can't use it's id as a base.
        // Instead, let's pass it as the initial value for the new document.
        await createVariantDocument({
          document: document,
          documentGroupId: documentId,
          variant: selectedVariant,
          selectedPerspective,
          ...(schemaType?.liveEdit ? {liveEdit: true} : {}),
        })
      } else {
        const baseDocument = findVariantCreateBaseDocument({
          variant: selectedVariant,
          documentVersions: versions,
          fallback: {_id: value._id, _rev: value._rev},
        })

        await createVariantDocument({
          baseId: baseDocument._id,
          ifBaseRevisionId: baseDocument._rev,
          documentGroupId: documentId,
          variant: selectedVariant,
          selectedPerspective,
          ...(schemaType?.liveEdit ? {liveEdit: true} : {}),
        })
      }
      setStatus('success')
    } catch (err) {
      toast.push({
        status: 'error',
        closable: true,
        title: t('banners.variant.error.title'),
        description: t('banners.variant.error.description', {
          message: err instanceof Error ? err.message : String(err),
        }),
      })
      setStatus('failed')
    }
  }, [
    createVariantDocument,
    documentId,
    value,
    selectedVariant,
    selectedPerspective,
    schemaType,
    t,
    toast,
    versions,
  ])

  useConditionalToast({
    status: 'info',
    id: 'add-document-to-variant',
    enabled: status === 'success',
    delay: TOAST_DELAY,
    closable: true,
    title: t('banners.variant.waiting.title'),
    description: t('banners.variant.waiting.description'),
  })

  // TODO: Use machine.
  const isActionAllowed = selectedPerspective === defaultPerspective || selectedReleaseId
  return (
    <Banner
      tone="suggest"
      content={
        <Text size={1}>
          <Translate
            i18nKey="banners.variant.not-in-variant"
            t={t}
            values={{
              variantTitle,
              perspectiveTitle,
            }}
            components={{VariantBadge: 'strong', PerspectiveTitle: 'strong'}}
          />
        </Text>
      }
      action={
        isActionAllowed
          ? {
              text: t('banners.variant.action.add-to-variant'),
              tone: 'suggest',
              disabled: status === 'in-progress' || status === 'success',
              onClick: handleAddToVariant,
              mode: 'default',
            }
          : undefined
      }
    />
  )
}
