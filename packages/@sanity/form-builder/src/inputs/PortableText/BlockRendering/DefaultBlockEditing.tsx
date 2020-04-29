import React from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'

import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {FormBuilderInput} from '../../../FormBuilderInput'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

type DefaultBlockEditingProps = {
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

export const DefaultBlockEditing = (props: DefaultBlockEditingProps): JSX.Element => {
  const {
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
  } = props

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
