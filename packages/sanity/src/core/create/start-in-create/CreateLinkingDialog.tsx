import {Box, Stack, Text} from '@sanity/ui'
import {useId} from 'react'

import {Dialog} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'

export function CreateLinkingDialog() {
  const {t} = useTranslation(createLocaleNamespace)
  const id = useId()

  return (
    <Dialog id={id} width={0} header={t('linking-in-progress-dialog.header')}>
      <Stack space={4}>
        <Box>
          <Text weight="semibold">{t('linking-in-progress-dialog.lede')}</Text>
        </Box>
        <Box>
          <Text>{t('linking-in-progress-dialog.details')}</Text>
        </Box>

        <Box>
          <Text size={0}>{t('linking-in-progress-dialog.auto-close')}</Text>
        </Box>
      </Stack>
    </Dialog>
  )
}
