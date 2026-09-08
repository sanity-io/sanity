import {Card} from '@sanity/ui'
import {Text, Box, VStack} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {commentsLocaleNamespace} from '../../i18n'

export function CommentsInspectorError({error}: {error: Error}) {
  const {t} = useTranslation(commentsLocaleNamespace)

  return (
    <Box padding={2}>
      <Card paddingX={2} paddingY={3} tone="critical" border radius={3}>
        <VStack gap={3}>
          <Text size={1} weight="medium" as="div" trim={true}>
            {t('inspector-error.title')}
          </Text>
          <Text size={1} muted as="div" trim={true}>
            {error.message}
          </Text>
        </VStack>
      </Card>
    </Box>
  )
}
