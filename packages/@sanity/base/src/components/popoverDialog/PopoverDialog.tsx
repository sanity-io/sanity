import {CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Flex, Popover, PopoverProps, Text} from '@sanity/ui'
import React, {HTMLProps} from 'react'

export function PopoverDialog(
  props: Omit<PopoverProps, 'content' | 'width'> &
    Omit<HTMLProps<HTMLDivElement>, 'ref' | 'width'> & {
      header?: React.ReactNode
      onClose: () => void
      width?: number | number[] | 'auto'
    }
) {
  const {children, header, onClose, width, ...restProps} = props

  return (
    <Popover
      {...restProps}
      content={
        <Container width={width}>
          <Flex direction="column">
            <Card flex="none">
              <Flex>
                <Box flex={1}>
                  <Text weight="semibold">{header}</Text>
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
        </Container>
      }
    />
  )
}
