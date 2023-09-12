import {Container, Stack, Text} from '@sanity/ui'
import React from 'react'
import {useTranslation} from '../../../../../i18n'

export function NoResults() {
  const {t} = useTranslation()

  return (
    <Container width={0}>
      <Stack aria-live="assertive" space={4} paddingX={4} paddingY={5}>
        <Text align="center" muted weight="semibold">
          {t('search.no-results-title')}
        </Text>
        <Text align="center" muted size={1}>
          {t('search.no-results-help-description')}
        </Text>
      </Stack>
    </Container>
  )
}
