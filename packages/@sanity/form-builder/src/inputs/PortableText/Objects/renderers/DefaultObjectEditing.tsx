import React, {useCallback, useEffect, useState} from 'react'
import {useId} from '@reach/auto-id'
import {Path, Marker, SchemaType} from '@sanity/types'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {PortableTextBlock, Type, PortableTextChild} from '@sanity/portable-text-editor'
import {Box, Dialog, useLayer} from '@sanity/ui'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PatchEvent} from '../../../../PatchEvent'

interface DefaultObjectEditingProps {
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

export function DefaultObjectEditing(props: DefaultObjectEditingProps) {
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
    type,
  } = props

  const dialogId = useId()

  const handleChange = useCallback((patchEvent: PatchEvent): void => onChange(patchEvent, path), [
    onChange,
    path,
  ])

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (rootElement) rootElement.addEventListener('keydown', handleKeyDown)
    return () => {
      if (rootElement) rootElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, rootElement])

  return (
    <Dialog
      id={dialogId || ''}
      onClose={onClose}
      onClickOutside={onClose}
      header={type.title}
      portal="default"
      ref={setRootElement}
      width={1}
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <Box padding={4}>
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
    </Dialog>
  )
}
