import {ResetIcon} from '@sanity/icons/Reset'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card} from '@sanity/ui'
import {Text, Box, Flex, VStack, Icon} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

type Props = {
  onClearValue?: () => void
}

export function InvalidImageWarning({onClearValue}: Props) {
  const {t} = useTranslation()
  return (
    <Card data-testid="invalid-image-warning" tone="caution" padding={4} border radius={2}>
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
            {t('inputs.image.invalid-image-warning.title')}
          </Text>
          <Text size={1} as="div" trim={true} tone="caution">
            {t('inputs.image.invalid-image-warning.description')}
          </Text>
        </VStack>
      </Flex>
      <Button
        icon={ResetIcon}
        mode="ghost"
        onClick={onClearValue}
        text={t('inputs.image.invalid-image-warning.reset-button.text')}
        width="fill"
      />
    </Card>
  )
}
