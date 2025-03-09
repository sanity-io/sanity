/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {Box, Flex, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {Fragment, type ReactNode, useCallback, useRef, useState} from 'react'
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
          handleClose()
        }
      },
      [handleClose],
    ),
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
    return Boolean(element.contentEditable) || Boolean(containerElement.current?.contains(element))
  }, [])

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={contentElement}
      containerElement={containerElement}
    >
      <FocusLock autoFocus as={Fragment} whiteList={handleFocusLockWhiteList}>
        <Flex ref={containerElement} direction="column" height="fill">
          <ContentHeaderBox flex="none" padding={1}>
            <Flex align="center">
              <Box flex={1} padding={2}>
                <Text weight="medium">{title}</Text>
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
