import {Card, Flex, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n/hooks/useTranslation'

export function InternalFormDecoratorInput() {
  const {t} = useTranslation()

  return (
    <Card border radius={2} padding={3} tone="critical">
      <Flex align="center" justify="center">
        <Text size={1} muted>
          {t('inputs.internal-form-decorator')}
        </Text>
      </Flex>
    </Card>
  )
}
