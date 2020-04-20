import React from 'react'

import DialogContent from 'part:@sanity/components/dialogs/content'
import Escapable from 'part:@sanity/components/utilities/escapable'
import Popover from 'part:@sanity/components/dialogs/popover'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {FormBuilderInput} from '../../../FormBuilderInput'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

type PopoverBlockEditingProps = {
  type: Type
  block: PortableTextBlock
  referenceElement: React.RefObject<HTMLDivElement>
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  handleChange: (patchEvent: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  onClose: () => void
}

const PopoverBlockEditing = (props: PopoverBlockEditingProps): JSX.Element => {
  const {
    type,
    block,
    referenceElement,
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
            <Popover
              placement="bottom"
              referenceElement={referenceElement.current}
              onClickOutside={onClose}
              onEscape={onClose}
              onClose={onClose}
              title={type.title}
              padding="none"
            >
              <DialogContent size="medium" padding="small">
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
            </Popover>
          </div>
        )}
      </Stacked>
    </div>
  )
}

export default PopoverBlockEditing
