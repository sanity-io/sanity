import {BinaryDocumentIcon, EllipsisVerticalIcon} from '@sanity/icons'
import React, {ReactNode} from 'react'

import styled from 'styled-components'

import {Button, Card, Flex, Inline, Menu, MenuButton, Stack, Text} from '@sanity/ui'
import {formatBytes} from '../../common/helper'

const ButtonWrapper = styled(Button)`
  width: 100%;
`

type Props = {
  children: ReactNode
  size: number
  originalFilename: string
  readOnly: boolean
}

export default function FileInfo(props: Props) {
  const {originalFilename, size, children, readOnly} = props

  return (
    <Flex align="center" justify="space-between" paddingRight={2}>
      <Card flex={1} tone={readOnly ? 'transparent' : 'default'}>
        <ButtonWrapper mode="bleed" padding={2} disabled={readOnly}>
          <Inline space={3} flex={1}>
            <Card padding={3} tone="transparent" shadow={1} radius={1}>
              <Text muted={readOnly}>
                <BinaryDocumentIcon />
              </Text>
            </Card>
            <Stack space={2}>
              <Text size={2} data-testid="file-name">
                {originalFilename}
              </Text>
              <Text size={1} muted data-testid="file-size">
                {formatBytes(size)}
              </Text>
            </Stack>
          </Inline>
        </ButtonWrapper>
      </Card>

      <Card tone={readOnly ? 'transparent' : 'default'}>
        <MenuButton
          button={
            <Button icon={EllipsisVerticalIcon} mode="bleed" data-testid="options-menu-button" />
          }
          popover={{tone: 'default'}}
          id="menu-button-example"
          menu={<Menu>{children}</Menu>}
        />
      </Card>
    </Flex>
  )
}
