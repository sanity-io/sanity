import {Card, Flex, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n/hooks/useTranslation'

export function FormDecorationInput() {
  const {t} = useTranslation()

  return (
    <Card border radius={2} padding={3} tone="critical">
      <Flex align="center" justify="center">
        <Text size={1} muted>
          {t('inputs.form-decoration-default')}
        </Text>
      </Flex>
    </Card>
  )
}
