import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'
import {type FieldValueError} from '../../validation'

/** @internal */
export function ValueError({error}: {error: FieldValueError}) {
  const {t} = useTranslation()
  return (
    <Card tone="critical" padding={3}>
      <Flex align="flex-start">
        <Box>
          <Text>
            <ErrorOutlineIcon />
          </Text>
        </Box>
        <Box flex={1} paddingLeft={3}>
          <Text size={1} as="p">
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
