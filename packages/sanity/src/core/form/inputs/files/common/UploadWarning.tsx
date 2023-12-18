import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack} from '@sanity/ui'
import React from 'react'
import {Button} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'
import {STALE_UPLOAD_MS} from '../constants'

type Props = {
  onClearStale?: () => void
}

export function UploadWarning({onClearStale}: Props) {
  const {t} = useTranslation()

  return (
    <Card tone="caution" padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3}>
          <Text size={1} weight="medium">
            {t('inputs.files.common.stale-upload-warning.title')}
          </Text>
          <Text size={1}>
            {t('inputs.files.common.stale-upload-warning.description', {
              staleThresholdMinutes: Math.ceil(STALE_UPLOAD_MS / 1000 / 60),
            })}
          </Text>
        </Stack>
      </Flex>
      <Button
        icon={ResetIcon}
        mode="ghost"
        onClick={onClearStale}
        text={t('inputs.files.common.stale-upload-warning.clear')}
        width="fill"
      />
    </Card>
  )
}
