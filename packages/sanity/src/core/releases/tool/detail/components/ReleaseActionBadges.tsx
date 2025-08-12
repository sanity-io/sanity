import {type ReleaseState} from '@sanity/client'
import {Badge, Box, Container, Flex, Skeleton} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'

import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {DOCUMENT_ACTION_CONFIGS, getDocumentActionType} from '../releaseDocumentActions'
import {type DocumentWithHistory} from '../ReleaseSummary'

interface ReleaseActionBadgesProps {
  documents: DocumentWithHistory[]
  releaseState: ReleaseState
  isLoading?: boolean
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
}: ReleaseActionBadgesProps) {
  const {t} = useTranslation(releasesLocaleNamespace)

  const {actionCounts, hasLoadingDocuments} = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        if (!acc.hasLoadingDocuments && doc.previewValues.isLoading) {
          acc.hasLoadingDocuments = true

          return acc
        }

        const actionType = getDocumentActionType(doc)
        if (actionType) {
          acc.actionCounts[actionType]++
        }

        return acc
      },
      {
        actionCounts: {added: 0, changed: 0, unpublished: 0},
        hasLoadingDocuments: false,
      },
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
              {t(translationKey)} {count}
            </Badge>
          )
        }
        return null
      })}

      {/* Show loading skeletons at the end for remaining action types */}
      {(hasLoadingDocuments || isLoading) &&
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
