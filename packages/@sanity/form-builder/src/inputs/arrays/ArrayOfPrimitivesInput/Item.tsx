import React from 'react'
import {Path, Marker, SchemaType} from '@sanity/types'
import {TrashIcon, DragHandleIcon} from '@sanity/icons'
import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import {FieldPresence} from '@sanity/base/presence'
import {Button} from '@sanity/ui'
import PatchEvent, {set} from '../../../PatchEvent'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ValidationStatus} from '../../../transitional/ValidationStatus'
import getEmptyValue from './getEmptyValue'

import styles from './Item.css'

const DragHandle = createDragHandle(() => (
  <span className={styles.dragHandle}>
    <Button icon={DragHandleIcon} mode="bleed" padding={2} />
  </span>
))

type Props = {
  type: SchemaType
  onChange: (event: PatchEvent) => void
  onRemove: (item: number) => void
  onEnterKey: (item: number) => void
  onEscapeKey: (item: number) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  markers: Array<Marker>
  index: number
  value: string | number | boolean
  compareValue?: string | number | boolean
  isSortable: boolean
  readOnly: boolean | null
  level: number
  presence: any
}

export default class Item extends React.PureComponent<Props> {
  handleRemove = () => {
    const {index, onRemove} = this.props
    onRemove(index)
  }
  handleKeyPress = (event) => {
    const {index, onEnterKey} = this.props
    if (event.key === 'Enter') {
      onEnterKey(index)
    }
  }
  handleKeyUp = (event: React.KeyboardEvent<any>) => {
    const {index, onRemove, onEscapeKey, value} = this.props
    if (event.shiftKey && event.key === 'Backspace' && value === '') {
      onRemove(index)
    }
    if (event.key === 'Escape') {
      onEscapeKey(index)
    }
  }
  handleChange = (patchEvent: PatchEvent) => {
    const {onChange, type, index} = this.props
    onChange(
      PatchEvent.from(
        patchEvent.patches.map((
          patch // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
        ) => (patch.path.length === 0 && patch.type === 'unset' ? set(getEmptyValue(type)) : patch))
      ).prefixAll(index)
    )
  }
  render() {
    const {
      value,
      level,
      markers,
      index,
      focusPath,
      onFocus,
      onBlur,
      compareValue,
      type,
      readOnly,
      isSortable,
      presence,
    } = this.props
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          {isSortable && !readOnly && <DragHandle className={styles.dragHandle} />}
          <div className={styles.input}>
            <FormBuilderInput
              value={value}
              path={[index]}
              compareValue={compareValue}
              markers={markers}
              focusPath={focusPath}
              onFocus={onFocus}
              onBlur={onBlur}
              type={type}
              readOnly={readOnly || type.readOnly}
              onKeyUp={this.handleKeyUp}
              onKeyPress={this.handleKeyPress}
              onChange={this.handleChange}
              level={level}
              presence={presence}
            />
          </div>
          <div className={styles.functions}>
            {markers.length > 0 && (
              <div className={styles.validationStatusContainer}>
                <ValidationStatus markers={markers} />
              </div>
            )}

            {(!type.title || type.title === '') && (
              <div className={styles.presenceContainer}>
                <FieldPresence presence={presence} maxAvatars={1} />
              </div>
            )}

            {!readOnly && (
              <div className={styles.removeButtonContainer}>
                <Button
                  icon={TrashIcon}
                  mode="bleed"
                  onClick={this.handleRemove}
                  padding={2}
                  title="Delete"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}
