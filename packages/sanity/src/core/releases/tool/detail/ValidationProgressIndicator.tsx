import {CheckmarkCircleIcon, ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'

import {ProgressIcon} from '../../../../ui-components/progressIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'
import {getDocumentValidationLoading} from '../../util/getDocumentValidationLoading'
import {type DocumentInRelease} from './useBundleDocuments'
import {CardTone} from '@sanity/ui/theme'

export function ValidationProgressIndicator({
  documents,
  layout = 'default',
}: {
  documents: DocumentInRelease[]
  layout?: 'default' | 'minimal'
}) {
  const totalCount = documents.length
  const {validatedCount, isValidating, hasError} = getDocumentValidationLoading(documents)
  const [showCheckmark, setShowCheckmark] = useState(false)
  // in order if the caching has already happened once and the object is already at minimal,
  // We don't want to show the whole thing again - instead we want to keep the minimal layout
  const [hasFinishedOnce, setHasFinishedOnce] = useState(false)
  const {t} = useTranslation(releasesLocaleNamespace)

  const isFinished = useMemo(
    () => validatedCount === totalCount && validatedCount !== 0,
    [validatedCount, totalCount],
  )

  // Use minimal layout if explicitly set OR if validation has finished once
  const isMinimal = layout === 'minimal' || hasFinishedOnce

  // Add delay when validation is finished
  // so that we can show that it's finished but then show the checkmark
  // without the text
  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        setShowCheckmark(true)
        setHasFinishedOnce(true)
      }, 2500)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isFinished, showCheckmark])

  useEffect(() => {
    // If it's not validating, we should not be showing the checkmark
    // it is only shown after a delay set by the previous useEffect
    if (isValidating) {
      setShowCheckmark(false)
    }
  }, [isValidating])

  // If it's not finished and not validating, we should not be showing anything
  // usually this happens when the release detail is first opened
  if (!isFinished && !isValidating) {
    return null
  }

  const tone: CardTone = isValidating
    ? 'neutral'
    : isFinished && showCheckmark && !hasError
      ? 'transparent'
      : hasError
        ? 'critical'
        : 'positive'

  const cardBackground = isFinished && showCheckmark && !hasError ? 'transparent' : undefined

  return (
    <Card
      padding={isMinimal ? 0 : 2}
      radius="full"
      tone={tone}
      style={{
        background: cardBackground,
      }}
    >
      <Flex gap={2}>
        <Text size={1}>
          {isValidating ? (
            <ProgressIcon progress={validatedCount / totalCount} />
          ) : (
            <Tooltip
              content={hasError ? t('summary.errors-found') : t('summary.all-documents-validated')}
            >
              {hasError ? <ErrorOutlineIcon /> : <CheckmarkCircleIcon />}
            </Tooltip>
          )}
        </Text>
        {!showCheckmark && !isMinimal && (
          <Text muted size={1}>
            {isValidating
              ? t('summary.validating-documents', {validatedCount, totalCount})
              : hasError
                ? t('summary.all-documents-errors-found')
                : t('summary.all-documents-validated')}
          </Text>
        )}
      </Flex>
    </Card>
  )
}
