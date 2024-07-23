/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {Box, Flex, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react'

import {Button, type PopoverProps} from '../../../../../../ui-components'
import {PresenceOverlay} from '../../../../../presence'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {type PortableTextEditorElement} from '../../Compositor'
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

export function PopoverEditDialog(props: PopoverEditDialogProps) {
  const {floatingBoundary, referenceBoundary, referenceElement, width = 1} = props
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
      data-testid="popover-edit-dialog"
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

  useClickOutsideEvent(
    onClose,
    () => [referenceElement],
    () => referenceBoundary,
  )

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
