import {Box, Card, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'

export function CommentsInspectorError({error}: {error: Error}) {
  const {t} = useTranslation(commentsLocaleNamespace)

  return (
    <Box padding={2}>
      <Card paddingX={2} paddingY={3} tone="critical" border radius={3}>
        <Stack space={3}>
          <Text size={1} weight="medium">
            {t('inspector-error.title')}
          </Text>
          <Text size={1} muted>
            {error.message}
          </Text>
        </Stack>
      </Card>
    </Box>
  )
}
