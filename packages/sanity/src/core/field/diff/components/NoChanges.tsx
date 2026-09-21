import {Text} from '@sanity/ui'
import {Flex} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'

/** @internal */
export function NoChanges() {
  const {t} = useTranslation()
  return (
    <Flex gap={3} paddingTop={2} flexDirection="column" flexShrink={0}>
      <Text size={1} weight="medium" as="h3">
        {t('changes.no-changes-title')}
      </Text>
      <Text as="p" size={1} muted>
        {t('changes.no-changes-description')}
      </Text>
    </Flex>
  )
}
