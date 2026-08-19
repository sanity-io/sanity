import {RestoreIcon} from '@sanity/icons/Restore'
import {Flex, Text} from '@sanity/ui'
import {format} from 'date-fns/format'
import {useContext} from 'react'
import {Translate, useTranslation} from 'sanity'
import {EventsContext} from 'sanity/_singletons'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {useDocumentPane} from '../useDocumentPane'

const StatusText = styled(Text)`
  color: var(--card-muted-fg-color);

  em {
    color: var(--card-fg-color);
    font-weight: 500;
    font-style: normal;
  }
`

export function RevisionStatusLine(): React.JSX.Element {
  const {displayed, revisionNotFound} = useDocumentPane()
  // Using the context instead of  `useEvents` because the context could not exist if the document pane is not using the events store and is instead
  // using the legacy timeline store.
  const events = useContext(EventsContext)
  const revision = events?.revision
  const revisionEvent = events?.events.find((ev) => ev.id === revision?.revisionId)

  const {t} = useTranslation()
  const date = revisionEvent?.timestamp || displayed?._updatedAt || displayed?._createdAt

  const message = {
    name: 'revision',
    text: date ? (
      <Translate
        t={t}
        i18nKey="document-status.revision-from"
        values={{
          date: format(new Date(date), `MMM d, yyyy '@' pp`),
        }}
      />
    ) : null,
    tone: 'caution',
  }

  return (
    <>
      <Flex flex={1} gap={3} padding={2}>
        <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
          <Text size={1}>
            <RestoreIcon />
          </Text>
        </Box>
        <Box flexBasis="0%" flexGrow={1}>
          <StatusText size={1} textOverflow="ellipsis">
            {revisionNotFound ? (
              <Translate t={t} i18nKey="document-status.revision-not-found" />
            ) : (
              message.text
            )}
          </StatusText>
        </Box>
      </Flex>
    </>
  )
}
