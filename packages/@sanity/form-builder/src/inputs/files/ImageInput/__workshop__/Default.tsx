import {SearchIcon, ChevronDownIcon, FolderIcon, ImageIcon, UploadIcon} from '@sanity/icons'
import {Card, Stack, Text, Flex, Box, Button, Menu, MenuItem, MenuButton} from '@sanity/ui'
import React from 'react'

export function Default(props) {
  const {drag, readOnly, assetSources} = props

  return (
    <Card
      data-container
      tone={drag ? 'primary' : 'default'}
      padding={4}
      border
      style={{borderStyle: 'dashed'}}
    >
      <Stack space={0}>
        {!readOnly && (
          <Flex justify="center">
            <Box marginBottom={4}>
              <Text size={1} muted={!drag}>
                <ImageIcon /> &nbsp;
                {drag ? 'Drop image here' : 'Drag or paste image here'}
              </Text>
            </Box>
          </Flex>
        )}

        <Flex data-buttons gap={1} justify="center">
          {!assetSources && (
            <Button
              text="Browse media"
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
                  iconRight={ChevronDownIcon}
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
      </Stack>
    </Card>
  )
}
