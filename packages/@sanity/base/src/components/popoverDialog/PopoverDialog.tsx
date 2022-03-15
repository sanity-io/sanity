import {CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Placement, Popover, Text} from '@sanity/ui'
import React from 'react'

export function PopoverDialog(props: {
  children?: React.ReactNode
  onClose: () => void
  placement?: Placement
  referenceElement?: HTMLElement | null
  title?: React.ReactNode
}) {
  const {children, onClose, placement, referenceElement, title} = props

  return (
    <Popover
      content={
        <Flex direction="column">
          {/* @todo: use `flex="none"` property */}
          <Card style={{flex: 'none'}}>
            <Flex>
              <Box flex={1}>
                <Text weight="semibold">{title}</Text>
              </Box>
              <Box>
                <Button icon={CloseIcon} onClick={onClose} />
              </Box>
            </Flex>
          </Card>
          <Card flex={1} overflow="auto">
            {children}
          </Card>
        </Flex>
      }
      placement={placement}
      referenceElement={referenceElement}
    />
  )
}
