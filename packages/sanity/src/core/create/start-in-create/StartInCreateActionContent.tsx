import {Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../i18n'
import {CreateSvg} from '../components/media/CreateSvg'
import {createLocaleNamespace} from '../i18n'

export function StartInCreateActionContent() {
  const {t} = useTranslation(createLocaleNamespace)

  return (
    <Stack space={4}>
      <CreateSvg />
      <Text size={1} weight="semibold">
        {t('start-in-create-dialog.lede')}
      </Text>
      <Text muted size={1}>
        {t('start-in-create-dialog.details')}
      </Text>
    </Stack>
  )
}
