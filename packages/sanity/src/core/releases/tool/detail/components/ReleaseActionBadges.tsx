import {type ReleaseState} from '@sanity/client'
import {Badge, Box, Container, Flex, Skeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type ReactNode, useMemo} from 'react'

import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {DOCUMENT_ACTION_CONFIGS, getDocumentActionType} from '../releaseDocumentActions'
import {type DocumentInRelease} from '../useBundleDocuments'

interface ReleaseActionBadgesProps {
  documents: DocumentInRelease[]
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

  const actionCounts = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        const actionType = getDocumentActionType(doc)
        if (actionType) {
          acc[actionType]++
        }
        return acc
      },
      {added: 0, changed: 0, unpublished: 0},
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

      {/* Show loading skeletons at the end for remaining action types */}
      {isLoading &&
        DOCUMENT_ACTION_CONFIGS.map(({key}) => {
          const count = actionCounts[key]

          if (count === 0) {
            return (
              <Skeleton
                key={`loading-skeleton-${key}`}
                animated
                radius={2}
                style={{
                  width: '60px',
                  height: '10px',
                  padding: `${vars.space[2]}, ${vars.space[3]}`,
                }}
              />
            )
          }
          return null
        })}
    </BadgesContainer>
  )
}
