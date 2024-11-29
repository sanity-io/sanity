import {Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'

/** @internal */
export function NoChanges() {
  const {t} = useTranslation()
  return (
    <Stack space={3} paddingTop={2}>
      <Text size={1} weight="medium" as="h3">
        {t('changes.no-changes-title')}
      </Text>
      <Text as="p" size={1} muted>
        {t('changes.no-changes-description')}
      </Text>
    </Stack>
  )
}
