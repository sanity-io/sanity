import {Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  getVariantTitle,
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
  const {value, documentId} = useDocumentPane()
  const {selectedPerspective, selectedVariant, selectedReleaseId} = usePerspective()
  const {versions} = useDocumentVersions({documentId})

  const {createVariantDocument} = useVariantDocumentOperations()
  const [status, setStatus] = useState<VariantDocumentCreateStatus>('idle')
  const toast = useToast()
  const defaultPerspective = useGetDefaultPerspective()

  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : ''

  const handleAddToVariant = useCallback(async () => {
    if (!selectedVariant) {
      return
    }

    setStatus('in-progress')
    try {
      const baseDocument = findVariantCreateBaseDocument({
        variant: selectedVariant,
        documentVersions: versions,
        fallback: {_id: value._id, _rev: value._rev},
      })

      await createVariantDocument({
        baseId: baseDocument._id,
        baseRevisionId: baseDocument._rev,
        variant: selectedVariant,
        selectedPerspective,
      })
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
  }, [createVariantDocument, value, selectedVariant, selectedPerspective, versions, t, toast])

  useConditionalToast({
    status: 'info',
    id: 'add-document-to-variant',
    enabled: status === 'success',
    delay: TOAST_DELAY,
    closable: true,
    title: t('banners.variant.waiting.title'),
    description: t('banners.variant.waiting.description'),
  })

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
              title: variantTitle,
            }}
            components={{
              VariantBadge: ({children}) => <strong>{children}</strong>,
            }}
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
