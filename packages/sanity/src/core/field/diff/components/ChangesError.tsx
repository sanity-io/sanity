import {Card, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'

/**
 * @internal
 * */
export function ChangesError() {
  const {t} = useTranslation()
  return (
    <Card tone="caution" padding={3}>
      <Stack space={3}>
        <Text size={1} weight="medium" as="h3">
          {t('changes.error-title')}
        </Text>
        <Text as="p" size={1} muted>
          {t('changes.error-description')}
        </Text>
      </Stack>
    </Card>
  )
}
