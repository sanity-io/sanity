import {CloseIcon} from '@sanity/icons'
import {
  Box,
  Flex,
  Layer,
  type ResponsiveWidthProps,
  Stack,
  Text,
  type Theme,
  usePortal,
} from '@sanity/ui'
import {type Dispatch, type ReactNode, type SetStateAction, useCallback} from 'react'
import TrapFocus, {type ReactFocusLockProps} from 'react-focus-lock'
import {css, styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../ui-components'
import {PopoverContainer} from './PopoverContainer'

const StyledPopover = styled(Popover)(() => {
  return css`
    /* Make the popover scrollable if it overflows the viewport */
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
  children: ReactNode
  header?: ReactNode
  onClose: () => void
  referenceElement: PopoverProps['referenceElement']
  width: ResponsiveWidthProps['width']
  containerRef?: Dispatch<SetStateAction<HTMLDivElement | null>>
}

/** @internal */
export function PopoverDialog(props: PopoverDialogProps) {
  const {children, header, onClose, referenceElement, containerRef, width} = props
  const portal = usePortal()

  const handleClose = useCallback(() => {
    onClose()

    // Set focus to the reference element when closing
    referenceElement?.focus()
  }, [onClose, referenceElement])

  // If the popover is opened inside a portal, trap focus only in that portal.
  // This allows focus interactions in panes outside of the portal scope, which
  // is especially important if the popover contains links to content that opens
  // in a separate pane (such as a reference).
  //
  // Note that providing an allow list to `TrapFocus` in this way does not enable
  // keyboard navigation outside of the `TrapFocus` component. This can be
  // enabled using groups or shards.
  //
  // https://github.com/theKashey/react-focus-lock/issues/97#issuecomment-594844115
  const trapPaneFocus: ReactFocusLockProps['whiteList'] = (interactionElement) =>
    !portal.element || portal.element.contains(interactionElement)

  // @todo: these use the same styles as dialogs, can this be shared?
  const content = (
    <PopoverContainer width={width} data-testid="popover-dialog">
      <TrapFocus autoFocus whiteList={trapPaneFocus}>
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
