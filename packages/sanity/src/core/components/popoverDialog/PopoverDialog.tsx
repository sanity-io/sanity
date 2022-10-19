import {CloseIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  focusFirstDescendant,
  Popover,
  PopoverProps,
  ResponsiveWidthProps,
  Text,
} from '@sanity/ui'
import React, {HTMLProps, useEffect, useRef} from 'react'

/** @internal */
export function PopoverDialog(
  props: Omit<PopoverProps, 'content' | 'width'> &
    Omit<HTMLProps<HTMLDivElement>, 'ref' | 'width'> & {
      header?: React.ReactNode
      onClose: () => void
      width?: ResponsiveWidthProps['width']
    }
) {
  const {children, header, onClose, width, ...restProps} = props
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    focusFirstDescendant(containerRef.current!)
  }, [])

  // Note: if you come here to attempt to add support for Escape to close and/or clickOutside to close, please read this first:
  //  - Escape must work with nested dialogs/popover. So if you have an array inside here that opens its items in another a popover,
  //    hitting escape should only close the topmost dialog
  //  - clickOutside needs to work through portals. So if you have an array inside here that opens its items in a dialog/portal,
  //    any clicks inside such dialogs or portals should not cause _this_ popover to close
  return (
    <Popover
      {...restProps}
      open
      portal
      padding={1}
      content={
        <Container width={width} ref={containerRef}>
          <Flex direction="column">
            <Card padding={1} flex="none">
              <Flex align="center">
                <Box padding={2} flex={1}>
                  <Text weight="semibold">{header}</Text>
                </Box>
                <Box>
                  <Button mode="bleed" icon={CloseIcon} onClick={onClose} />
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
