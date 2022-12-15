import i18n from 'i18next'
import k from './../../../../../../i18n/keys'
import {ControlsIcon} from '@sanity/icons'
import {Flex, Inline, Text} from '@sanity/ui'
import React from 'react'

export function Instructions() {
  return (
    <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
      <Inline space={3}>
        <Text muted>{i18n.t(k.USE)}</Text>
        <Text muted>
          <ControlsIcon />
        </Text>
        <Text muted>{i18n.t(k.TO_REFINE_YOUR_SEARCH)}</Text>
      </Inline>
    </Flex>
  )
}
