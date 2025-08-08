import {type ReleaseState} from '@sanity/client'
import {Badge, Box, Container, Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {DOCUMENT_ACTION_CONFIGS, getDocumentActionType} from '../releaseDocumentActions'
import {type DocumentWithHistory} from '../ReleaseSummary'

interface ReleaseActionBadgesProps {
  documents: DocumentWithHistory[]
  releaseState: ReleaseState
}

export function ReleaseActionBadges({documents, releaseState}: ReleaseActionBadgesProps) {
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
  if (releaseState === 'archived' || releaseState === 'published' || !documents.length) {
    return null
  }

  return (
    <Container width={3}>
      <Box padding={3}>
        <Flex align="center" gap={4} wrap="wrap">
          {DOCUMENT_ACTION_CONFIGS.map(({key, tone, translationKey}) => {
            const count = actionCounts[key]
            if (count === 0) return null

            return (
              <Badge key={key} paddingX={3} paddingY={2} radius={2} tone={tone}>
                {t(translationKey)} {count}
              </Badge>
            )
          })}
        </Flex>
      </Box>
    </Container>
  )
}
