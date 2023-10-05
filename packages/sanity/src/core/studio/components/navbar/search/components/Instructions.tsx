import {ControlsIcon} from '@sanity/icons'
import {Flex, Inline, Text} from '@sanity/ui'
import React from 'react'
import {Translate, useTranslation} from '../../../../../i18n'

export function Instructions() {
  const {t} = useTranslation()

  return (
    <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
      <Inline space={3}>
        <Text muted>
          <Translate
            t={t}
            i18nKey="search.instructions"
            components={{
              ControlsIcon: () => <ControlsIcon key={0} style={{padding: '0 0.25rem'}} />,
            }}
          />
        </Text>
      </Inline>
    </Flex>
  )
}
