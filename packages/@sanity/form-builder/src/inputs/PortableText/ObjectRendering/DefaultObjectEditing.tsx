/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Stacked from 'part:@sanity/components/utilities/stacked'

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

export const DefaultObjectEditing: FunctionComponent<Props> = ({
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
} ): JSX.Element => {
  return (
    <div>
      <Stacked>
        {(): JSX.Element => (
          <div>
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
              </DialogContent>
            </DefaultDialog>
          </div>
        )}
      </Stacked>
    </div>
  )
}
