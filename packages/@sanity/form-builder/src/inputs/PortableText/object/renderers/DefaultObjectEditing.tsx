import React, {useCallback, useEffect, useState} from 'react'
import {useId} from '@reach/auto-id'
import {Path, Marker, SchemaType} from '@sanity/types'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {
  PortableTextBlock,
  Type,
  PortableTextChild,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Box, Dialog, useGlobalKeyDown, useLayer} from '@sanity/ui'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PatchEvent} from '../../../../PatchEvent'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'
import {ModalWidth} from './types'

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
  width?: ModalWidth
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
    width = 'medium',
  } = props

  const dialogId = useId()

  const handleChange = useCallback((patchEvent: PatchEvent): void => onChange(patchEvent, path), [
    onChange,
    path,
  ])

  return (
    <Dialog
      id={dialogId || ''}
      onClose={onClose}
      header={type.title}
      portal="default"
      width={DIALOG_WIDTH_TO_UI_WIDTH[width]}
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
