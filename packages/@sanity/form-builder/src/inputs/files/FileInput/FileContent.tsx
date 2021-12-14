import {BinaryDocumentIcon, EllipsisHorizontalIcon, EllipsisVerticalIcon} from '@sanity/icons'
import React, {JSXElementConstructor, ReactElement} from 'react'
import {FileAsset} from '@sanity/types'

import styled from 'styled-components'

import {Button, Flex, MenuButton, Text} from '@sanity/ui'

const ButtonContainer = styled(Button)`
  z-index: 100;
`

type Props = {
  children: ReactElement<any, string | JSXElementConstructor<any>>
  assetDocument: FileAsset
}

export default function WithMaterializedReference(props: Props) {
  const {assetDocument, children} = props

  return (
    <Flex
      align="center"
      justify="space-between"
      gap={[3, 4, 4]}
      direction={['column-reverse', 'column-reverse', 'row']}
    >
      <Flex align="center" gap={2} flex={1}>
        <Flex justify="center">
          <Text>
            <BinaryDocumentIcon />
          </Text>
        </Flex>
        <Flex justify="center">
          <Text size={1}>{assetDocument.originalFilename}</Text>
        </Flex>
      </Flex>

      <MenuButton
        button={<ButtonContainer icon={EllipsisVerticalIcon} mode="bleed" />}
        id="menu-button-example"
        menu={children}
        popover={{portal: true}}
      />
    </Flex>
  )
}
