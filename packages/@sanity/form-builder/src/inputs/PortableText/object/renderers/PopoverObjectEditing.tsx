/* eslint-disable react/no-unused-prop-types */
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {CloseIcon} from '@sanity/icons'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {Path, Marker, SchemaType} from '@sanity/types'
import {
  Box,
  Button,
  Container,
  Flex,
  Popover,
  PopoverProps,
  Text,
  useBoundaryElement,
  useClickOutside,
  useElementRect,
  useLayer,
} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import styled from 'styled-components'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PatchEvent} from '../../../../PatchEvent'
import {POPOVER_WIDTH_TO_UI_WIDTH} from './constants'
import {debugElement} from './debug'
import {ModalWidth} from './types'

interface PopoverObjectEditingProps {
  editorPath: Path
  elementRef: React.MutableRefObject<HTMLElement>
  focusPath: Path
  markers: Marker[]
  object: PortableTextBlock | PortableTextChild
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onClose: () => void
  onFocus: (path: Path) => void
  path: Path
  presence: FormFieldPresence[]
  readOnly: boolean
  type: Type
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
  background-color: var(--card-bg-color);
  box-shadow: 0 1px 0 var(--card-shadow-outline-color);
  position: relative;
  z-index: 10;
  min-height: auto;
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

export function PopoverObjectEditing(props: PopoverObjectEditingProps) {
  const {width, elementRef} = props
  const refElement = elementRef.current
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const boundaryElement = useBoundaryElement()
  const boundaryElementRect = useElementRect(boundaryElement.element)

  const contentStyle: React.CSSProperties = useMemo(
    () => ({
      opacity: boundaryElementRect ? undefined : 0,
      width: boundaryElementRect ? `${boundaryElementRect.width - 16}px` : undefined,
    }),
    [boundaryElementRect]
  )

  return (
    <RootPopover
      constrainSize
      content={<Content {...props} rootElement={rootElement} style={contentStyle} width={width} />}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      placement="bottom"
      open
      portal="default"
      ref={setRootElement}
      referenceElement={refElement || (debugElement as any)}
    />
  )
}

function Content(
  props: PopoverObjectEditingProps & {
    rootElement: HTMLDivElement | null
    style: React.CSSProperties
  }
) {
  const {
    focusPath,
    markers,
    object,
    onBlur,
    onChange,
    onClose,
    onFocus,
    path,
    presence,
    readOnly,
    rootElement,
    style,
    type,
    width = 'small',
  } = props
  const {isTopLayer} = useLayer()
  const {element: boundaryElement} = useBoundaryElement()

  const handleChange = useCallback((patchEvent: PatchEvent): void => onChange(patchEvent, path), [
    onChange,
    path,
  ])

  const handleClose = useCallback(() => {
    if (isTopLayer) onClose()
  }, [isTopLayer, onClose])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    },
    [handleClose]
  )

  useClickOutside(handleClose, [rootElement], boundaryElement)

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <ContentContainer style={style} width={POPOVER_WIDTH_TO_UI_WIDTH[width]}>
      <Flex direction="column" flex={1}>
        <ContentHeaderBox padding={1}>
          <Flex align="center">
            <Box flex={1} padding={2}>
              <Text weight="semibold">{type.title}</Text>
            </Box>

            <Button icon={CloseIcon} mode="bleed" onClick={handleClose} padding={2} />
          </Flex>
        </ContentHeaderBox>
        <ContentScrollerBox flex={1}>
          <PresenceOverlay margins={[0, 0, 1, 0]}>
            <Box padding={3}>
              <FormBuilderInput
                focusPath={focusPath}
                level={0}
                markers={markers}
                onBlur={onBlur}
                onChange={handleChange}
                onFocus={onFocus}
                path={path}
                presence={presence}
                readOnly={readOnly || type.readOnly}
                type={type as SchemaType}
                value={object}
              />
            </Box>
          </PresenceOverlay>
        </ContentScrollerBox>
      </Flex>
    </ContentContainer>
  )
}
