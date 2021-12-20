import {BinaryDocumentIcon, EllipsisVerticalIcon} from '@sanity/icons'
import React, {JSXElementConstructor, ReactElement} from 'react'
import {FileAsset} from '@sanity/types'

import styled from 'styled-components'

import {Button, Card, Flex, Inline, MenuButton, Stack, Text} from '@sanity/ui'
import {formatBytes} from '../../common/helper'

const ButtonWrapper = styled(Button)`
  width: 100%;
`

type Props = {
  children: ReactElement<any, string | JSXElementConstructor<any>>
  assetDocument: FileAsset
  readOnly: boolean
}

export default function WithMaterializedReference(props: Props) {
  const {assetDocument, children, readOnly} = props
  const size = assetDocument.size

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
              <Text size={2}>{assetDocument.originalFilename}</Text>
              <Text size={1} muted>
                {formatBytes(size)}
              </Text>
            </Stack>
          </Inline>
        </ButtonWrapper>
      </Card>

      <Card tone={readOnly ? 'transparent' : 'default'}>
        <MenuButton
          button={<Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} />}
          popover={{tone: 'default'}}
          id="menu-button-example"
          menu={children}
        />
      </Card>
    </Flex>
  )
}
