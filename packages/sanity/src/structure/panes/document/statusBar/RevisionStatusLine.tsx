import {RestoreIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {Translate, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {useDocumentPane} from '../useDocumentPane'

export const StatusText = styled(Text)`
  color: var(--card-muted-fg-color);

  em {
    color: var(--card-fg-color);
    font-weight: 500;
    font-style: normal;
  }
`

export function RevisionStatusLine(): React.JSX.Element {
  const {displayed} = useDocumentPane()
  const {t} = useTranslation()
  const date = displayed?._updatedAt || displayed?._createdAt

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
        <Box flex="none">
          <Text size={1}>
            <RestoreIcon />
          </Text>
        </Box>
        <Box flex={1}>
          <StatusText size={1} textOverflow="ellipsis">
            {message.text}
          </StatusText>
        </Box>
      </Flex>
    </>
  )
}
