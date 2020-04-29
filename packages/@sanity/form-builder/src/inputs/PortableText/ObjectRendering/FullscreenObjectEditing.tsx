/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Stacked from 'part:@sanity/components/utilities/stacked'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'

import {FormBuilderInput} from '../../../FormBuilderInput'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

type Props = {
  type: Type
  block: PortableTextBlock
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  handleChange: (patchEvent: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  onClose: (event: React.SyntheticEvent) => void
}

export const FullscreenObjectEditing: FunctionComponent<Props> = ({
  type,
  block,
  readOnly,
  markers,
  focusPath,
  path,
  handleChange,
  onFocus,
  onBlur,
  onClose
}): JSX.Element => {
  return (
    <div>
      <Stacked>
        {(isActive: boolean): JSX.Element => (
          <div>
            <FullscreenDialog
              isOpen
              title={type.title}
              onEscape={(event: React.SyntheticEvent): void => isActive && onClose(event)}
              onClose={onClose}
            >
              {/* TODO: Styling */}
              {/* <div className={styles.formBuilderInputWrapper}> */}
              <div>
                <FormBuilderInput
                  type={type}
                  level={0}
                  readOnly={readOnly || type.readOnly}
                  value={block}
                  onChange={handleChange}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  focusPath={focusPath}
                  path={path}
                  markers={markers}
                />
              </div>
            </FullscreenDialog>
          </div>
        )}
      </Stacked>
    </div>
  )
}
