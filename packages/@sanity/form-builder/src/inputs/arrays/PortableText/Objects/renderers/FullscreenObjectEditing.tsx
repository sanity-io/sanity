/* eslint-disable react/prop-types */

import {PortableTextBlock, Type, PortableTextChild} from '@sanity/portable-text-editor'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {Path, Marker, SchemaType} from '@sanity/types'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import React, {useCallback} from 'react'
import {FormBuilderInput} from '../../../../../FormBuilderInput'
import {PatchEvent} from '../../../../../PatchEvent'

interface FullscreenObjectEditingProps {
  focusPath: Path
  markers: Marker[]
  object: PortableTextBlock | PortableTextChild
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onClose: (event: React.SyntheticEvent) => void
  onFocus: (path: Path) => void
  path: Path
  presence: FormFieldPresence[]
  readOnly: boolean
  type: Type
}

export function FullscreenObjectEditing({
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
}: FullscreenObjectEditingProps) {
  const handleChange = useCallback((patchEvent: PatchEvent): void => onChange(patchEvent, path), [
    onChange,
    path,
  ])

  const handleEscape = useCallback((event: React.SyntheticEvent): void => onClose(event), [onClose])

  return (
    <FullscreenDialog isOpen onClose={onClose} onEscape={handleEscape} title={type.title}>
      {/* @todo: styling */}
      {/* <div className={styles.formBuilderInputWrapper}> */}

      <PresenceOverlay margins={[0, 0, 1, 0]}>
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
      </PresenceOverlay>
    </FullscreenDialog>
  )
}
