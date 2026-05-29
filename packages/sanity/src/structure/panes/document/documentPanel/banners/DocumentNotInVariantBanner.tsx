import {Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
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

const TOAST_DELAY = 1000

type VariantDocumentCreateState = {
  status: 'creating' | 'created'
  lastUpdate: Date
}

export function DocumentNotInVariantBanner() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {value} = useDocumentPane()
  const {selectedPerspective, selectedPerspectiveName, selectedVariant} = usePerspective()
  const {createVariantDocument} = useVariantDocumentOperations()
  const [createState, setCreateState] = useState<VariantDocumentCreateState | undefined>()
  const toast = useToast()

  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : ''

  const handleAddToVariant = useCallback(async () => {
    setCreateState({status: 'creating', lastUpdate: new Date()})
    if (!selectedVariant) {
      throw new Error('No variant selected')
    }
    try {
      await createVariantDocument({
        document: value,
        variant: selectedVariant,
        selectedPerspectiveName: selectedPerspectiveName,
        selectedPerspective: selectedPerspective,
      })
      setCreateState({status: 'created', lastUpdate: new Date()})
    } catch (err) {
      toast.push({
        status: 'error',
        closable: true,
        title: t('banners.variant.error.title'),
        description: t('banners.variant.error.description', {
          message: err instanceof Error ? err.message : String(err),
        }),
      })
      setCreateState(undefined)
    }
  }, [
    createVariantDocument,
    value,
    selectedVariant,
    selectedPerspective,
    selectedPerspectiveName,
    t,
    toast,
  ])

  const now = useCurrentTime(200)

  useConditionalToast({
    status: 'info',
    id: 'add-document-to-variant',
    enabled: Boolean(
      createState?.status === 'created' &&
      now.getTime() - createState.lastUpdate.getTime() > TOAST_DELAY,
    ),
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
        disabled: Boolean(createState),
        onClick: handleAddToVariant,
        mode: 'default',
      }}
    />
  )
}

function useCurrentTime(updateIntervalMs: number): Date {
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, updateIntervalMs)
    return () => clearInterval(intervalId)
  }, [updateIntervalMs])
  return currentTime
}
