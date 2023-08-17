import {ControlsIcon} from '@sanity/icons'
import {Flex, Inline, Text} from '@sanity/ui'
import React from 'react'
import {useTranslation} from '../../../../../i18n'

export function Instructions() {
  const {t} = useTranslation()

  return (
    <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
      <Inline space={3}>
        <Text muted>{t('navbar.search.instructions')}</Text>
        <Text muted>
          <ControlsIcon />
        </Text>
      </Inline>
    </Flex>
  )
}
