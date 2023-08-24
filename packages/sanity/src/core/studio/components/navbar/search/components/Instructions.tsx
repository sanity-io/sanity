import {ControlsIcon} from '@sanity/icons'
import {Flex, Inline, Text} from '@sanity/ui'
import React from 'react'
import {Trans} from 'react-i18next'
import {useTranslation} from '../../../../../i18n'

export function Instructions() {
  const {t} = useTranslation()

  return (
    <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
      <Inline space={3}>
        <Text muted>
          <Trans
            t={t}
            i18nKey="navbar.search.instructions"
            components={[<ControlsIcon key={0} style={{padding: '0 0.25rem'}} />]}
          />
        </Text>
      </Inline>
    </Flex>
  )
}
