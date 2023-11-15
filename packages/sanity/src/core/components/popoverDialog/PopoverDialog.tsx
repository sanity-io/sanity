import {CloseIcon} from '@sanity/icons'
import {
  Box,
  Flex,
  Layer,
  Popover,
  PopoverProps,
  ResponsiveWidthProps,
  Stack,
  Text,
  Theme,
} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled, {css} from 'styled-components'
import TrapFocus from 'react-focus-lock'
import {Button} from '../../../ui'
import {PopoverContainer} from './PopoverContainer'

const StyledPopover = styled(Popover)(() => {
  return css`
    // Make the popover scrollable if it overflows the viewport
    [data-ui='Popover__wrapper'] {
      overflow: auto;
    }
  `
})

// This layer is sticky so that the header is always visible when scrolling
const StickyLayer = styled(Layer)((props: {theme: Theme}) => {
  const radii = props.theme.sanity.radius[3]

  return css`
    position: sticky;
    top: 0;
    width: 100%;
    background: var(--card-bg-color);
    border-bottom: 1px solid var(--card-border-color);
    border-top-left-radius: ${radii}px;
    border-top-right-radius: ${radii}px;
  `
})

interface PopoverDialogProps {
  children: React.ReactNode
  header?: React.ReactNode
  onClose: () => void
  referenceElement: PopoverProps['referenceElement']
  width: ResponsiveWidthProps['width']
  containerRef?: React.Dispatch<React.SetStateAction<HTMLDivElement | null>>
}

/** @internal */
export function PopoverDialog(props: PopoverDialogProps) {
  const {children, header, onClose, referenceElement, containerRef, width} = props

  const handleClose = useCallback(() => {
    onClose()

    // Set focus to the reference element when closing
    referenceElement?.focus()
  }, [onClose, referenceElement])

  // @todo: these use the same styles as dialogs, can this be shared?
  const content = (
    <PopoverContainer width={width}>
      <TrapFocus autoFocus>
        <Stack ref={containerRef}>
          <StickyLayer>
            <Box padding={2} paddingLeft={4}>
              <Flex align="center" gap={2}>
                <Box flex={1}>
                  <Text size={1} textOverflow="ellipsis" weight="medium">
                    {header}
                  </Text>
                </Box>
                <Button
                  icon={CloseIcon}
                  mode="bleed"
                  onClick={handleClose}
                  tooltipProps={{content: 'close'}}
                />
              </Flex>
            </Box>
          </StickyLayer>
          <Box padding={4}>{children}</Box>
        </Stack>
      </TrapFocus>
    </PopoverContainer>
  )

  // Note: if you come here to attempt to add support for Escape to close and/or clickOutside to close, please read this first:
  //  - Escape must work with nested dialogs/popover. So if you have an array inside here that opens its items in another a popover,
  //    hitting escape should only close the topmost dialog
  //  - clickOutside needs to work through portals. So if you have an array inside here that opens its items in a dialog/portal,
  //    any clicks inside such dialogs or portals should not cause _this_ popover to close
  return (
    <StyledPopover
      portal
      constrainSize
      content={content}
      open
      referenceElement={referenceElement}
    />
  )
}
