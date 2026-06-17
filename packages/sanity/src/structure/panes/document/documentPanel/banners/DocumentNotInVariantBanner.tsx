import {Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  getVariantTitle,
  Translate,
  useConditionalToast,
  usePerspective,
  useTranslation,
  useVariantDocumentOperations,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

// Once the create action resolves, there's a short delay before the new variant-scoped version
// propagates and this banner unmounts. Surface a toast if that window exceeds this threshold.
const TOAST_DELAY = 1000

type VariantDocumentCreateStatus = 'idle' | 'in-progress' | 'success' | 'failed'

export function DocumentNotInVariantBanner() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {value} = useDocumentPane()
  const {selectedPerspective, selectedVariant} = usePerspective()
  const {createVariantDocument} = useVariantDocumentOperations()
  const [status, setStatus] = useState<VariantDocumentCreateStatus>('idle')
  const toast = useToast()

  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : ''

  const handleAddToVariant = useCallback(async () => {
    if (!selectedVariant) {
      return
    }

    setStatus('in-progress')
    try {
      await createVariantDocument({
        document: value,
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
  }, [createVariantDocument, value, selectedVariant, selectedPerspective, t, toast])

  useConditionalToast({
    status: 'info',
    id: 'add-document-to-variant',
    enabled: status === 'success',
    delay: TOAST_DELAY,
    closable: true,
    title: t('banners.variant.waiting.title'),
    description: t('banners.variant.waiting.description'),
  })

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
      action={{
        text: t('banners.variant.action.add-to-variant'),
        tone: 'suggest',
        disabled: status === 'in-progress' || status === 'success',
        onClick: handleAddToVariant,
        mode: 'default',
      }}
    />
  )
}
