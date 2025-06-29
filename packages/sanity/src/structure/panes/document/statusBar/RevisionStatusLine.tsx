import {RestoreIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {format} from 'date-fns'
import {Translate, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {useDocumentPane} from '../useDocumentPane'

export const StatusText = styled(Text)`
  color: ${vars.color.muted.fg};

  em {
    color: ${vars.color.fg};
    font-weight: 500;
    font-style: normal;
  }
`

export function RevisionStatusLine(): React.JSX.Element {
  const {displayed, revisionNotFound} = useDocumentPane()
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
