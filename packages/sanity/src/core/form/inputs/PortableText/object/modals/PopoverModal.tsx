/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {Box, Button, Flex, PopoverProps, Text, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import {PresenceOverlay} from '../../../../../presence'
import {PortableTextEditorElement} from '../../Compositor'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {ModalWidth} from './types'
import {
  ContentContainer,
  ContentHeaderBox,
  ContentScrollerBox,
  ModalWrapper,
  RootPopover,
} from './PopoverModal.styles'

interface PopoverEditDialogProps {
  autoFocus?: boolean
  boundaryElement?: PortableTextEditorElement
  children: React.ReactNode
  onClose: () => void
  referenceElement?: PortableTextEditorElement
  title: string | React.ReactNode
  width?: ModalWidth
}

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

export function PopoverEditDialog(props: PopoverEditDialogProps) {
  const {referenceElement, boundaryElement} = props
  const [open, setOpen] = useState(false)

  // This hook is here to set open after the initial render.
  // If rendered immediately, the popover will for a split second be
  // visible in the top left of the boundaryElement before correctly
  // placed pointing at the reference element.
  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <RootPopover
      boundaryElement={boundaryElement}
      content={<Content {...props} />}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open={open}
      placement="bottom"
      portal="default"
      referenceElement={referenceElement}
    />
  )
}

function Content(props: PopoverEditDialogProps) {
  const {onClose, referenceElement, width = 0, title, boundaryElement, autoFocus} = props

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      },
      [onClose]
    )
  )

  useClickOutside(onClose, referenceElement ? [referenceElement] : [], boundaryElement)

  // This seems to work with regular refs as well, but it might be safer to use state.
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)

  return (
    <VirtualizerScrollInstanceProvider scrollElement={contentElement}>
      <ContentContainer width={width}>
        <ModalWrapper direction="column" flex={1}>
          <ContentHeaderBox padding={1}>
            <Flex align="center">
              <Box flex={1} padding={2}>
                <Text weight="semibold">{title}</Text>
              </Box>

              <Button
                autoFocus={Boolean(autoFocus)}
                icon={CloseIcon}
                mode="bleed"
                onClick={onClose}
                padding={2}
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
        </ModalWrapper>
      </ContentContainer>
    </VirtualizerScrollInstanceProvider>
  )
}
