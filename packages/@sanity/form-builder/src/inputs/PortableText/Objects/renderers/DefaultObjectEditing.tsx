/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'
import {PortableTextBlock, Type, PortableTextChild} from '@sanity/portable-text-editor'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {FormBuilderInput} from '../../../../FormBuilderInput'
import {Marker, Presence} from '../../../../typedefs'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'
import {Overlay as PresenceOverlay} from '@sanity/components/presence'

type Props = {
  type: Type
  object: PortableTextBlock | PortableTextChild
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  onClose: (event: React.SyntheticEvent) => void
  presence: Presence[]
}

export const DefaultObjectEditing: FunctionComponent<Props> = ({
  type,
  object,
  readOnly,
  markers,
  focusPath,
  path,
  onChange,
  onFocus,
  onBlur,
  presence,
  onClose
}): JSX.Element => {
  const handleChange = (patchEvent: PatchEvent): void => onChange(patchEvent, path)
  return (
    <Stacked>
      {(): JSX.Element => (
        <DefaultDialog
          isOpen
          title={type.title}
          onClose={onClose}
          onClickOutside={onClose}
          showCloseButton
        >
          <DialogContent size="medium">
            {/* TODO: Styling */}
            {/* <div className={styles.formBuilderInputWrapper}> */}
            <div>
              <PresenceOverlay>
                <FormBuilderInput
                  type={type}
                  level={0}
                  readOnly={readOnly || type.readOnly}
                  value={object}
                  onChange={handleChange}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  presence={presence}
                  focusPath={focusPath}
                  path={path}
                  markers={markers}
                />
              </PresenceOverlay>
            </div>
          </DialogContent>
        </DefaultDialog>
      )}
    </Stacked>
  )
}
