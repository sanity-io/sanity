/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {Box, Flex, PopoverProps, Text, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Button} from '../../../../../../ui'
import {PresenceOverlay} from '../../../../../presence'
import {PortableTextEditorElement} from '../../Compositor'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {ModalWidth} from './types'
import {ContentHeaderBox, ContentScrollerBox, RootPopover} from './PopoverModal.styles'

interface PopoverEditDialogProps {
  autoFocus?: boolean
  children: React.ReactNode
  floatingBoundary: HTMLElement | null
  onClose: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: PortableTextEditorElement | null
  title: string | React.ReactNode
  width?: ModalWidth
}

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

export function PopoverEditDialog(props: PopoverEditDialogProps) {
  const {floatingBoundary, referenceBoundary, referenceElement, width = 0} = props
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
      content={<Content {...props} />}
      constrainSize
      data-ui="PopoverEditDialog"
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      floatingBoundary={floatingBoundary}
      open={open}
      overflow="auto"
      placement="bottom"
      portal="default"
      preventOverflow
      referenceBoundary={referenceBoundary}
      referenceElement={referenceElement}
      width={width}
    />
  )
}

function Content(props: PopoverEditDialogProps) {
  const {onClose, referenceBoundary, referenceElement, title, autoFocus} = props

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      },
      [onClose],
    ),
  )

  useClickOutside(onClose, referenceElement ? [referenceElement] : [], referenceBoundary)

  // This seems to work with regular refs as well, but it might be safer to use state.
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={contentElement}
      containerElement={containerElement}
    >
      <Flex ref={containerElement} direction="column" height="fill">
        <ContentHeaderBox flex="none" padding={1}>
          <Flex align="center">
            <Box flex={1} padding={2}>
              <Text weight="medium">{title}</Text>
            </Box>

            <Button
              autoFocus={Boolean(autoFocus)}
              icon={CloseIcon}
              mode="bleed"
              onClick={onClose}
              size="small"
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
    </VirtualizerScrollInstanceProvider>
  )
}
