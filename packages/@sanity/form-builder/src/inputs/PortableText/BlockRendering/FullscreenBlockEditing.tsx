import React from 'react'

import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Stacked from 'part:@sanity/components/utilities/stacked'
import Escapable from 'part:@sanity/components/utilities/escapable'

import {FormBuilderInput} from '../../../FormBuilderInput'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

type FullscreenBlockEditingProps = {
  type: Type
  block: PortableTextBlock
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  handleChange: (patchEvent: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  onClose: () => void
}

const FullscreenBlockEditing = (props: FullscreenBlockEditingProps): JSX.Element => {
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
        {isActive => (
          <div>
            <Escapable onEscape={() => isActive && onClose()} />
            <FullscreenDialog isOpen title={type.title} onClose={onClose}>
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

export default FullscreenBlockEditing
