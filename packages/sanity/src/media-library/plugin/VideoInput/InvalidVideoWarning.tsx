import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../core/i18n/hooks/useTranslation'
import {Button} from '../../../ui-components/button/Button'
import {mediaLibraryLocaleNamespace} from '../i18n'

type Props = {
  onClearValue?: () => void
}

export function InvalidVideoWarning({onClearValue}: Props) {
  const {t} = useTranslation(mediaLibraryLocaleNamespace)
  return (
    <Card data-testid="invalid-video-warning" tone="caution" padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3}>
          <Text size={1} weight="medium">
            {t('invalid-video-warning.title')}
          </Text>
          <Text size={1}>{t('invalid-video-warning.description')}</Text>
        </Stack>
      </Flex>
      <Button
        icon={ResetIcon}
        mode="ghost"
        onClick={onClearValue}
        text={t('invalid-video-warning.reset-button.text')}
        width="fill"
      />
    </Card>
  )
}
