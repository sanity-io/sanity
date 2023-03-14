/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Container,
  Flex,
  Popover,
  PopoverProps,
  Text,
  useClickOutside,
  useGlobalKeyDown,
} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import styled from 'styled-components'
import {PresenceOverlay} from '../../../../../presence'
import {PortableTextEditorElement} from '../../Compositor'
import {ModalWidth} from './types'

interface PopoverEditDialogProps {
  children: React.ReactNode
  onClose: () => void
  referenceElement?: PortableTextEditorElement
  boundaryElement?: PortableTextEditorElement
  title: string | React.ReactNode
  width?: ModalWidth
}

const RootPopover = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    visibility: hidden;
    pointer-events: none;
  }

  & > div {
    overflow: hidden;
  }
`

const ContentContainer = styled(Container)`
  &:not([hidden]) {
    display: flex;
  }
  direction: column;
`

const ContentScrollerBox = styled(Box)`
  /* Prevent overflow caused by change indicator */
  overflow-x: hidden;
  overflow-y: auto;
`

const ContentHeaderBox = styled(Box)`
  box-shadow: 0 1px 0 var(--card-shadow-outline-color);
  position: relative;
  z-index: 10;
  min-height: auto;
`

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
      constrainSize
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
  const {onClose, referenceElement, width = 0, title, boundaryElement} = props

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

  return (
    <ContentContainer width={width}>
      <Flex direction="column" flex={1}>
        <ContentHeaderBox padding={1}>
          <Flex align="center">
            <Box flex={1} padding={2}>
              <Text weight="semibold">{title}</Text>
            </Box>

            <Button icon={CloseIcon} mode="bleed" onClick={onClose} padding={2} />
          </Flex>
        </ContentHeaderBox>
        <ContentScrollerBox flex={1}>
          <PresenceOverlay margins={[0, 0, 1, 0]}>
            <Box padding={3}>{props.children}</Box>
          </PresenceOverlay>
        </ContentScrollerBox>
      </Flex>
    </ContentContainer>
  )
}
