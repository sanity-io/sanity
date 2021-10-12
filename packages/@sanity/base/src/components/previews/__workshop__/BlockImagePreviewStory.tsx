import {DocumentIcon, EditIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {Card, Container, Flex, MenuButton, Text, Menu, MenuItem, Button} from '@sanity/ui'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React from 'react'
import {BlockImagePreview} from '..'

export default function BlockImagePreviewStory() {
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const description = useString('Description', undefined, 'Props')
  const withImage = useBoolean('With image', true, 'Props')
  const withStatus = useBoolean('With status', false, 'Props')

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={1}>
          <BlockImagePreview
            description={description}
            actions={
              <MenuButton
                id="id"
                button={<Button icon={EllipsisVerticalIcon} mode="bleed" />}
                menu={
                  <Menu>
                    <MenuItem text="Item 1" />
                  </Menu>
                }
              />
            }
            media={
              withImage ? (
                <img src="https://source.unsplash.com/600x600/?abstract" />
              ) : (
                <DocumentIcon />
              )
            }
            status={
              withStatus && (
                <Text muted size={1}>
                  <EditIcon />
                </Text>
              )
            }
            subtitle={subtitle}
            title={title}
          />
        </Container>
      </Flex>
    </Card>
  )
}
