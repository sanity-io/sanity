import {Marker, Path, SchemaType} from '@sanity/types'
import React, {useMemo, useState} from 'react'
import {BoundaryElementProvider, Box, Dialog, Layer} from '@sanity/ui'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PopoverDialog} from '../../../../transitional/PopoverDialog'
import {ArrayMember} from '../types'
import PatchEvent from '../../../../PatchEvent'
import {isEmpty} from './helpers'

type Props = {
  type: SchemaType
  value: ArrayMember
  dialogType: 'dialog' | 'fullscreen' | 'fold' | 'popover'
  compareValue?: any[]
  markers: Marker[]
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  onClose: () => void
  filterField: () => any
  referenceElement: null | HTMLElement
  readOnly: boolean | null
  focusPath: Path
  presence: FormFieldPresence[]
}

export function EditDialog(props: Props) {
  const {
    type,
    value,
    markers,
    focusPath,
    onFocus,
    onBlur,
    onClose,
    onChange,
    readOnly,
    filterField,
    referenceElement,
    presence,
    dialogType,
    compareValue,
  } = props

  const title = readOnly ? type.title || '' : `Edit ${type.title || ''}`

  const childMarkers = useMemo(() => markers.filter((marker) => marker.path.length > 1), [markers])
  const childPresence = useMemo(() => presence.filter((_presence) => _presence.path.length > 1), [
    presence,
  ])

  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

  const content = (
    <BoundaryElementProvider element={boundaryElement}>
      <FormBuilderInput
        type={type}
        level={0}
        value={isEmpty(value) ? undefined : value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        compareValue={compareValue}
        focusPath={focusPath}
        readOnly={readOnly || type.readOnly || false}
        markers={childMarkers}
        path={[{_key: value._key}]}
        filterField={filterField}
        presence={childPresence}
      />
    </BoundaryElementProvider>
  )

  if (dialogType === 'fullscreen') {
    return (
      <Layer>
        <Dialog
          width="auto"
          id={value._key}
          onClose={onClose}
          key={value._key}
          header={title}
          position="absolute"
        >
          <PresenceOverlay margins={[0, 0, 1, 0]}>
            <Box padding={4} ref={setBoundaryElement}>
              {content}
            </Box>
          </PresenceOverlay>
        </Dialog>
      </Layer>
    )
  }

  if (dialogType === 'popover' || dialogType === 'fold') {
    if (dialogType === 'fold') {
      console.warn(`The option named \`editItem: "fold"\` is no longer supported`)
    }

    return (
      <PopoverDialog
        onClose={onClose}
        referenceElement={referenceElement}
        placement="auto"
        title={title}
      >
        <PresenceOverlay margins={[0, 0, 1, 0]}>
          <Box ref={setBoundaryElement}>{content}</Box>
        </PresenceOverlay>
      </PopoverDialog>
    )
  }

  return (
    <Dialog
      width={1}
      id={value._key}
      onClose={onClose}
      key={value._key}
      header={title}
      position="absolute"
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <Box padding={4} ref={setBoundaryElement}>
          {content}
        </Box>
      </PresenceOverlay>
    </Dialog>
  )
}
