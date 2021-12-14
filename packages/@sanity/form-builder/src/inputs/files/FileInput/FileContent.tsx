import {BinaryDocumentIcon, EllipsisVerticalIcon, ImageIcon} from '@sanity/icons'
import React, {JSXElementConstructor, ReactElement, useCallback, useState} from 'react'
import {FileAsset} from '@sanity/types'

import {
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  Tooltip,
  ToastParams,
  Popover,
  useClickOutside,
} from '@sanity/ui'

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
        button={<EllipsisVerticalIcon />}
        id="menu-button-example"
        menu={children}
        placement="right"
        popover={{portal: true}}
      />
    </Flex>
  )
}
