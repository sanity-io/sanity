import {Box, Text} from '@sanity/ui'
import React from 'react'
import {useTranslation} from 'sanity'

export function Branding() {
  const {t} = useTranslation('testStudio')
  return (
    <Box padding={3}>
      <Text weight="bold">{t('brandingTitle')}&trade;</Text>
    </Box>
  )
}
