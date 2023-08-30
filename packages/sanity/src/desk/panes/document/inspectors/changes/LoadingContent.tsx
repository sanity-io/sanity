import React from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'
import {Delay} from '../../../../components'
import {useTranslation} from 'sanity'

export function LoadingContent() {
  const {t} = useTranslation('studio')

  return (
    <Delay ms={300}>
      <Flex align="center" direction="column" height="fill" justify="center" paddingTop={3}>
        <Spinner muted />
        <Box marginTop={3}>
          <Text align="center" muted size={1}>
            {t('changes.loading-changes')}
          </Text>
        </Box>
      </Flex>
    </Delay>
  )
}
