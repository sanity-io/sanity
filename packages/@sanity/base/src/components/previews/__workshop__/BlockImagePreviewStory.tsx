import {EditIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Card, Container, Flex, MenuButton, Text, Menu, MenuItem, Button} from '@sanity/ui'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React from 'react'
import {BlockImagePreview} from '../blockImagePreview'

export default function BlockImagePreviewStory() {
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const description = useString('Description', undefined, 'Props')
  const withImage = useBoolean('With image', true, 'Props')
  const withStatus = useBoolean('With status', false, 'Props')
  const withActions = useBoolean('With actions', true, 'Props')

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={1}>
          <Card border>
            <BlockImagePreview
              description={description}
              actions={
                withActions && (
                  <MenuButton
                    id="id"
                    button={<Button fontSize={1} icon={EllipsisVerticalIcon} mode="bleed" />}
                    menu={
                      <Menu>
                        <MenuItem text="Edit" icon={EditIcon} />
                        <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
                      </Menu>
                    }
                    popover={{constrainSize: true}}
                  />
                )
              }
              media={withImage && <img src="https://source.unsplash.com/600x600" />}
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
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
