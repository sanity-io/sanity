import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {CloseIcon} from '@sanity/icons'
import {
  PortableTextBlock,
  PortableTextChild,
  PortableTextEditor,
  Type,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Path, Marker, SchemaType} from '@sanity/types'
import {Box, Button, Flex, Popover, PopoverProps, Text, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import styled from 'styled-components'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PatchEvent} from '../../../../PatchEvent'

interface PopoverObjectEditingProps {
  // eslint-disable-next-line react/no-unused-prop-types
  editorPath: Path
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
}

const Root = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    display: none;
  }

  & > div {
    overflow: hidden;
  }
`

const ContentRoot = styled(Flex)`
  overflow: hidden;
  width: calc(100vw - 16px);
  max-width: 320px;
`

const Header = styled(Box)`
  background-color: var(--card-bg-color);
  box-shadow: 0 1px 0 var(--card-shadow-outline-color);
  position: relative;
  z-index: 10;
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

function getEditorElement(editor: PortableTextEditor, editorPath: Path) {
  const [editorObject] = PortableTextEditor.findByPath(editor, editorPath)

  // eslint-disable-next-line react/no-find-dom-node
  return PortableTextEditor.findDOMNode(editor, editorObject) as HTMLElement
}

export function PopoverObjectEditing(props: PopoverObjectEditingProps) {
  const {editorPath, object} = props
  const editor = usePortableTextEditor()
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [refElement, setRefElement] = useState(() => getEditorElement(editor, editorPath))

  useEffect(() => {
    setRefElement(getEditorElement(editor, editorPath))
  }, [editor, editorPath, object])

  return (
    <Root
      constrainSize
      content={<Content {...props} rootElement={rootElement} />}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      placement="bottom"
      open
      portal="default"
      ref={setRootElement}
      referenceElement={refElement}
    />
  )
}

function Content(props: PopoverObjectEditingProps & {rootElement: HTMLDivElement | null}) {
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
    type,
  } = props

  const handleChange = useCallback((patchEvent: PatchEvent): void => onChange(patchEvent, path), [
    onChange,
    path,
  ])

  const {isTopLayer} = useLayer()

  const handleClose = useCallback(() => {
    if (isTopLayer) onClose()
  }, [isTopLayer, onClose])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    },
    [handleClose]
  )

  useClickOutside(handleClose, [rootElement])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <ContentRoot direction="column">
      <Header padding={1}>
        <Flex align="center">
          <Box flex={1} padding={2}>
            <Text weight="semibold">{type.title}</Text>
          </Box>

          <Button icon={CloseIcon} mode="bleed" onClick={handleClose} padding={2} />
        </Flex>
      </Header>
      <Box flex={1} overflow="auto">
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
      </Box>
    </ContentRoot>
  )
}
