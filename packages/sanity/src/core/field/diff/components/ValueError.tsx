import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card} from '@sanity/ui'
import {Text, Box, Flex, Icon} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type FieldValueError} from '../../validation'

/** @internal */
export function ValueError({error}: {error: FieldValueError}) {
  const {t} = useTranslation()
  return (
    <Card tone="critical" padding={3}>
      <Flex alignItems="flex-start">
        <Box>
          <Icon icon={ErrorOutlineIcon} tone="critical" />
        </Box>
        <Box flexBasis="0%" flexGrow={1} paddingLeft={3}>
          <Text size={1} as="p" trim={true} tone="critical">
            {t(error.messageKey, {
              expectedType: error.expectedType,
              actualType: error.actualType,
            })}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
