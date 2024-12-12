/* eslint-disable react/no-unused-prop-types */

import {CloseIcon} from '@sanity/icons'
import {Box, Flex, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type ReactNode, useCallback, useRef, useState} from 'react'
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

  useEffect(() => {
    // When rendered, focus on the first input element in the content
    if (contentElement) {
      contentElement.querySelector('input')?.focus()
    }
  }, [contentElement])

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
