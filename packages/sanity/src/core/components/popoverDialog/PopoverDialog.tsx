import {CloseIcon} from '@sanity/icons'
import {Box, type ContainerProps, Flex, Layer, Stack, Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type Dispatch, type ReactNode, type SetStateAction, useCallback} from 'react'
import TrapFocus from 'react-focus-lock'
import {styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../ui-components'

// This layer is sticky so that the header is always visible when scrolling
const StickyLayer = styled(Layer)`
  position: sticky;
  top: 0;
  width: 100%;
  background: ${vars.color.bg};
  border-bottom: 1px solid ${vars.color.border};
  border-top-left-radius: ${vars.radius[3]};
  border-top-right-radius: ${vars.radius[3]};
`

interface PopoverDialogProps {
  children: ReactNode
  header?: ReactNode
  onClose: () => void
  referenceElement: PopoverProps['referenceElement']
  width: ContainerProps['width']
  containerRef?: Dispatch<SetStateAction<HTMLDivElement | null>>
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
                tooltipProps={{content: 'Close'}}
              />
            </Flex>
          </Box>
        </StickyLayer>
        <Box padding={4}>{children}</Box>
      </Stack>
    </TrapFocus>
  )

  // Note: if you come here to attempt to add support for Escape to close and/or clickOutside to close, please read this first:
  //  - Escape must work with nested dialogs/popover. So if you have an array inside here that opens its items in another a popover,
  //    hitting escape should only close the topmost dialog
  //  - clickOutside needs to work through portals. So if you have an array inside here that opens its items in a dialog/portal,
  //    any clicks inside such dialogs or portals should not cause _this_ popover to close
  return (
    <Popover
      portal
      constrainSize
      content={content}
      open
      overflow="auto"
      referenceElement={referenceElement}
      width={width}
    />
  )
}
