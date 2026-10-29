import {ResetIcon} from '@sanity/icons/Reset'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card} from '@sanity/ui'
import {Text, Box, Flex, VStack, Icon} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
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
          <Icon
            size={1}
            muted
            icon={WarningOutlineIcon}
            tone="caution"
            style={{
              margin: '-0.3125rem',
              marginLeft: '-0.375rem',
            }}
          />
        </Box>
        <VStack gap={3}>
          <Text size={1} weight="medium" as="div" trim={true} tone="caution">
            {t('inputs.files.common.stale-upload-warning.title')}
          </Text>
          <Text size={1} as="div" trim={true} tone="caution">
            {t('inputs.files.common.stale-upload-warning.description', {
              staleThresholdMinutes: Math.ceil(STALE_UPLOAD_MS / 1000 / 60),
            })}
          </Text>
        </VStack>
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
