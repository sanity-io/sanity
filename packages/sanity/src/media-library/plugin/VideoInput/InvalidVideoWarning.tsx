import {ResetIcon} from '@sanity/icons/Reset'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card, Stack} from '@sanity/ui'
import {Text, Flex, Box, Icon} from 'ui5'

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
          <Icon size={1} icon={WarningOutlineIcon} tone="caution" style={{margin: '-0.375rem'}} />
        </Box>
        <Stack gap={3}>
          <Text size={1} weight="medium" as="div" trim={true} tone="caution">
            {t('invalid-video-warning.title')}
          </Text>
          <Text size={1} as="div" trim={true} tone="caution">
            {t('invalid-video-warning.description')}
          </Text>
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
