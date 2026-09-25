import {Text} from '@sanity/ui'
import {Container, Flex} from 'ui5'

import {useTranslation} from '../../../../../i18n/hooks/useTranslation'

export function NoResults() {
  const {t} = useTranslation()

  return (
    <Container size={0}>
      <Flex aria-live="assertive" gap={4} paddingX={4} paddingY={5} flexDirection="column">
        <Text align="center" muted size={1} weight="medium">
          {t('search.no-results-title')}
        </Text>
        <Text align="center" muted size={1}>
          {t('search.no-results-help-description')}
        </Text>
      </Flex>
    </Container>
  )
}
