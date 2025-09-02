import {CheckmarkCircleIcon, ErrorOutlineIcon} from '@sanity/icons'
import {Card, type CardTone, Flex, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'

import {ProgressIcon} from '../../../../ui-components/progressIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useDocumentValidationLoading} from '../../hooks/useDocumentValidationLoading'
import {releasesLocaleNamespace} from '../../i18n'
import {type DocumentInRelease} from './useBundleDocuments'

export function ValidationProgressIndicator({documents}: {documents: DocumentInRelease[]}) {
  const totalCount = documents.length
  const {validatedCount, isValidating, hasError} = useDocumentValidationLoading(documents)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const {t} = useTranslation(releasesLocaleNamespace)

  const isFinished = useMemo(
    () => validatedCount === totalCount && validatedCount !== 0,
    [validatedCount, totalCount],
  )

  // Add delay when validation is finished
  // so that we can show that it's finished but then show the checkmark
  // without the text
  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        setShowCheckmark(true)
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
      padding={2}
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
        {!showCheckmark && (
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
