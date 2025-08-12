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

  const actionCounts = useMemo(
    () =>
      documents.reduce(
        (counts, doc) => {
          const actionType = getDocumentActionType(doc)
          if (actionType) {
            counts[actionType]++
          }
          return counts
        },
        {added: 0, changed: 0, unpublished: 0},
      ),
    [documents],
  )

  // Hide action badges for archived and published releases (same logic as table columns)
  if (releaseState === 'archived' || releaseState === 'published') return null

  if (isLoading) {
    return (
      <BadgesContainer>
        {DOCUMENT_ACTION_CONFIGS.map(({key}) => (
          <Skeleton
            key={`skeleton-action-badge-${key}`}
            animated
            style={{width: '60px', height: '10px'}}
            radius={2}
            paddingX={3}
            paddingY={2}
          />
        ))}
      </BadgesContainer>
    )
  }

  if (!documents.length) return null

  return (
    <BadgesContainer>
      {DOCUMENT_ACTION_CONFIGS.map(({key, tone, translationKey}) => {
        const count = actionCounts[key]
        if (count === 0) return null

        return (
          <Badge key={key} paddingX={3} paddingY={2} radius={2} tone={tone}>
            {t(translationKey)} {count}
          </Badge>
        )
      })}
    </BadgesContainer>
  )
}
