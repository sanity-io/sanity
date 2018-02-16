// @flow
import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import styles from './styles/Item.css'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import ValidationStatus from 'part:@sanity/components/validation/status'

import PatchEvent, {set} from '../../PatchEvent'
import getEmptyValue from './getEmptyValue'

import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import type {Type, Marker} from '../../typedefs'
import type {Path} from '../../typedefs/path'

const DragHandle = createDragHandle(() => (
  <span className={styles.dragHandle}>
    <DragBarsIcon />
  </span>
))

type Props = {
  type: Type,
  onChange: PatchEvent => void,
  onRemove: number => void,
  onEnterKey: number => void,
  onEscapeKey: number => void,
  onFocus: Path => void,
  onBlur: () => void,
  focusPath: Path,
  markers: Array<Marker>,
  index: number,
  value: string | number | boolean,
  isSortable: boolean,
  readOnly: ?boolean,
  level: number
}
export default class Item extends React.PureComponent<Props> {
  handleRemove = () => {
    const {index, onRemove} = this.props
    onRemove(index)
  }

  handleKeyPress = event => {
    const {index, onEnterKey} = this.props
    if (event.key === 'Enter') {
      onEnterKey(index)
    }
  }

  handleKeyUp = (event: SyntheticKeyEvent<*>) => {
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
        patchEvent.patches.map(
          patch =>
            // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
            patch.path.length === 0 && patch.type === 'unset' ? set(getEmptyValue(type)) : patch
        )
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
      type,
      readOnly,
      isSortable
    } = this.props
    return (
      <div className={styles.root}>
        {isSortable && !readOnly && <DragHandle className={styles.dragHandle} />}
        <div className={styles.input}>
          <FormBuilderInput
            value={value}
            path={[index]}
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
          />
        </div>
        <div className={styles.functions}>
          <div className={styles.validationStatus}>
            <ValidationStatus markers={markers} />
          </div>
          {!readOnly && (
            <div>
              <Button
                kind="simple"
                className={styles.deleteButton}
                icon={TrashIcon}
                title="Delete"
                onClick={this.handleRemove}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
}
