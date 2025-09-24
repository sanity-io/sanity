/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {Box, Flex, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type PropsWithChildren, type ReactNode, useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {type PortableTextEditorElement} from 'sanity/_singletons'

import {Button, type PopoverProps} from '../../../../../../ui-components'
import {PresenceOverlay} from '../../../../../presence'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {ContentHeaderBox, ContentScrollerBox, RootPopover} from './PopoverModal.styles'
import {type ModalWidth} from './types'

interface PopoverEditDialogProps {
  autoFocus?: boolean
  children: ReactNode
  floatingBoundary: HTMLElement | null
  onClose: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: PortableTextEditorElement | null
  title: string | ReactNode
  width?: ModalWidth
}

/**
 * Wrapper for focus lock that maintains scroll on the popover
 * Unlike Fragment (on some react versions) this does not absorb the ref prop
 */
const NoopContainer = ({children, ...props}: PropsWithChildren) => (
  <div
    {...props}
    // Makes the div focusable so clicking on the popover will move the focus away from the input once focus lock is active
    // Solves an issue when scrolling the popover and then clicking outside of the input will scroll back the popover to the input.
    tabIndex={-1}
  >
    {children}
  </div>
)

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

export function PopoverEditDialog(props: PopoverEditDialogProps): ReactNode {
  const {floatingBoundary, referenceBoundary, referenceElement, width = 1} = props
  return (
    <RootPopover
      content={<Content {...props} />}
      constrainSize
      data-testid="popover-edit-dialog"
      data-ui="PopoverEditDialog"
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      floatingBoundary={floatingBoundary}
      open
      overflow="auto"
      placement="bottom"
      portal="default"
      preventOverflow
      referenceBoundary={referenceBoundary}
      referenceElement={referenceElement}
      width={width}
      autoFocus
      tone="default"
    />
  )
}

function Content(props: PopoverEditDialogProps) {
  const {onClose, referenceBoundary, referenceElement, title} = props
  const isClosedRef = useRef(false)

  const handleClose = useCallback(() => {
    isClosedRef.current = true
    onClose()
  }, [onClose])

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          handleClose()
        }
      },
      [handleClose],
    ),
    {
      /**
       * We need to capture the event to prevent it from being propagated to the parent
       * This is needed when, for example, in order for the fullscreen mode to be closed
       * Last over existing popovers
       */
      capture: true,
    },
  )

  useClickOutsideEvent(
    handleClose,
    () => [referenceElement],
    () => referenceBoundary,
  )

  // This seems to work with regular refs as well, but it might be safer to use state.
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)

  const handleFocusLockWhiteList = useCallback((element: HTMLElement) => {
    // This is needed in order for focusLock not to trap focus in the
    // popover when closing the popover and focus is to be returned to the editor
    if (isClosedRef.current) return false

    const target = element as Node
    const portalElements = document.querySelectorAll('[data-portal]')
    const isWithinPortal = Array.from(portalElements).some((portal) => portal.contains(target))

    // We want to have an exception to the clicking when the target is outside of the portal
    // And the popover is not closed.
    // This is needed in order for focusLock not to trap focus in the modal
    // Because then, if we are trying to change matters in an opened pane, focusLock will trap focus in the modal
    if (!isWithinPortal && !isClosedRef.current) return false

    return Boolean(element.contentEditable) || Boolean(containerElement.current?.contains(element))
  }, [])

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={contentElement}
      containerElement={containerElement}
    >
      <FocusLock autoFocus whiteList={handleFocusLockWhiteList}>
        <Flex
          as={NoopContainer}
          // @ts-expect-error - TODO: fix this
          ref={containerElement}
          direction="column"
          height="fill"
        >
          <ContentHeaderBox flex="none" padding={1}>
            <Flex align="center">
              <Box flex={1} padding={2}>
                <Text size={1} weight="medium">
                  {title}
                </Text>
              </Box>

              <Button
                autoFocus
                icon={CloseIcon}
                mode="bleed"
                onClick={handleClose}
                tooltipProps={{content: 'Close'}}
              />
            </Flex>
          </ContentHeaderBox>
          <ContentScrollerBox flex={1}>
            <PresenceOverlay margins={[0, 0, 1, 0]}>
              <Box padding={3} ref={setContentElement}>
                {props.children}
              </Box>
            </PresenceOverlay>
          </ContentScrollerBox>
        </Flex>
      </FocusLock>
    </VirtualizerScrollInstanceProvider>
  )
}
