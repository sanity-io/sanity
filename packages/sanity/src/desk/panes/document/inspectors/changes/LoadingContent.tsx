import React from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'
import {Delay} from '../../../../components'
import {deskLocaleNamespace} from '../../../../i18n'
import {useTranslation} from 'sanity'

export function LoadingContent() {
  const {t} = useTranslation(deskLocaleNamespace)

  return (
    <Delay ms={300}>
      <Flex align="center" direction="column" height="fill" justify="center" paddingTop={3}>
        <Spinner muted />
        <Box marginTop={3}>
          <Text align="center" muted size={1}>
            {t('review-changes.loading-changes')}
          </Text>
        </Box>
      </Flex>
    </Delay>
  )
}
