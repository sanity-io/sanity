import {
  SearchIcon,
  ChevronDownIcon,
  FolderIcon,
  ImageIcon,
  UploadIcon,
  ReadOnlyIcon,
} from '@sanity/icons'
import {Card, Stack, Text, Flex, Box, Button, Menu, MenuItem, MenuButton} from '@sanity/ui'
import React from 'react'

export function Default(props) {
  const {drag, readOnly, assetSources} = props
  return (
    <Card
      data-container
      tone={drag ? 'primary' : readOnly ? 'transparent' : 'default'}
      padding={[4, 4, 3]}
      border
      style={{borderStyle: drag ? 'solid' : 'dashed'}}
    >
      <Flex
        space={4}
        align="center"
        justify="space-between"
        direction={['column', 'column', 'row']}
        gap={4}
      >
        <Flex justify="center" flex={1}>
          <Text size={1} muted={!drag}>
            {readOnly ? <ReadOnlyIcon /> : <ImageIcon />} &nbsp;
            {readOnly ? 'Read only' : drag ? 'Drop image here' : 'Drag or paste image here'}
            {}
          </Text>
        </Flex>

        <Flex data-buttons gap={1} justify="center">
          {!assetSources && (
            <Button
              text="Browse"
              mode="ghost"
              icon={SearchIcon}
              disabled={readOnly || drag}
              fontSize={2}
            />
          )}
          {assetSources && (
            <MenuButton
              id="asset-source-menubutton"
              button={
                <Button
                  text="Browse"
                  icon={SearchIcon}
                  mode="ghost"
                  disabled={readOnly || drag}
                  fontSize={2}
                />
              }
              menu={
                <Menu icon={FolderIcon} text="Browse">
                  <MenuItem icon={ImageIcon} text="Media" />
                  <MenuItem icon={ImageIcon} text="Unsplash" />
                </Menu>
              }
              portal
            />
          )}
          <Button
            text="Upload"
            mode="ghost"
            icon={UploadIcon}
            disabled={readOnly || drag}
            fontSize={2}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
