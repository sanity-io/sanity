import EditItemFold from 'part:@sanity/components/edititem/fold'
import {Marker, Path, SchemaType} from '@sanity/types'
import React from 'react'
import {Box, Dialog, Layer} from '@sanity/ui'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {PopoverDialog} from '../../../components/PopoverDialog'
import {ArrayMember} from '../types'
import PatchEvent from '../../../PatchEvent'
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

  const childMarkers = markers.filter((marker) => marker.path.length > 1)
  const childPresence = presence.filter((_presence) => _presence.path.length > 1)

  const content = (
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
            <Box padding={4}>{content}</Box>
          </PresenceOverlay>
        </Dialog>
      </Layer>
    )
  }

  // TODO(@benedicteb, 2020-12-04) Make a plan for what to do with fold
  if (dialogType === 'fold') {
    return (
      <div>
        <EditItemFold title={title} onClose={onClose}>
          <PresenceOverlay margins={[0, 0, 1, 0]}>{content}</PresenceOverlay>
        </EditItemFold>
      </div>
    )
  }

  if (dialogType === 'popover') {
    return (
      <PopoverDialog
        onClose={onClose}
        referenceElement={referenceElement}
        placement="auto"
        depth={10}
      >
        <PresenceOverlay margins={[0, 0, 1, 0]}>{content}</PresenceOverlay>
      </PopoverDialog>
    )
  }

  return (
    <Layer>
      <Dialog
        width={1}
        id={value._key}
        onClose={onClose}
        key={value._key}
        header={title}
        position="absolute"
      >
        <PresenceOverlay margins={[0, 0, 1, 0]}>
          <Box padding={4}>{content}</Box>
        </PresenceOverlay>
      </Dialog>
    </Layer>
  )
}
