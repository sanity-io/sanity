import {type ReleaseState} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Badge, Box, Container, Flex, Skeleton} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {DOCUMENT_ACTION_CONFIGS, getDocumentActionType} from '../releaseDocumentActions'
import {type DocumentInRelease} from '../useBundleDocuments'

interface ReleaseActionBadgesProps {
  documents: DocumentInRelease[]
  releaseState: ReleaseState
  isLoading?: boolean
  showErrorsOnly?: boolean
  onToggleErrorsFilter?: () => void
}

const BadgesContainer = ({children}: {children: ReactNode}) => (
  <Container width={3}>
    <Box padding={3}>
      <Flex align="center" gap={4} wrap="wrap">
        {children}
      </Flex>
    </Box>
  </Container>
)

export function ReleaseActionBadges({
  documents,
  releaseState,
  isLoading = false,
  showErrorsOnly = false,
  onToggleErrorsFilter,
}: ReleaseActionBadgesProps) {
  const {t} = useTranslation(releasesLocaleNamespace)

  const {actionCounts, errorCount} = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        const actionType = getDocumentActionType(doc)
        if (actionType) {
          acc.actionCounts[actionType]++
        }
        if (doc.validation?.hasError) {
          acc.errorCount++
        }
        return acc
      },
      {actionCounts: {added: 0, changed: 0, unpublished: 0}, errorCount: 0},
    )
  }, [documents])

  // Hide action badges for archived and published releases (same logic as table columns)
  if (releaseState === 'archived' || releaseState === 'published') {
    return null
  }

  if (!isLoading && !documents.length) {
    return null
  }

  return (
    <BadgesContainer>
      {DOCUMENT_ACTION_CONFIGS.map(({key, tone, translationKey}) => {
        const count = actionCounts[key]

        if (count > 0) {
          return (
            <Badge key={key} paddingX={3} paddingY={2} radius={2} tone={tone}>
              {t(translationKey)}: {count}
            </Badge>
          )
        }
        return null
      })}

      {/* Validation errors filter button */}
      {errorCount > 0 && onToggleErrorsFilter && (
        <Button
          icon={ErrorOutlineIcon}
          mode={showErrorsOnly ? 'default' : 'bleed'}
          onClick={onToggleErrorsFilter}
          selected={showErrorsOnly}
          text={t('filter.validation-errors', {count: errorCount})}
          tone="critical"
          aria-label={
            showErrorsOnly
              ? t('filter.validation-errors.clear-aria-label')
              : t('filter.validation-errors.aria-label')
          }
        />
      )}

      {/* Show loading skeletons at the end for remaining action types */}
      {isLoading &&
        DOCUMENT_ACTION_CONFIGS.map(({key}) => {
          const count = actionCounts[key]

          if (count === 0) {
            return (
              <Skeleton
                key={`loading-skeleton-${key}`}
                animated
                style={{width: '60px', height: '10px'}}
                radius={2}
                paddingX={3}
                paddingY={2}
              />
            )
          }
          return null
        })}
    </BadgesContainer>
  )
}
