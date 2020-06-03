import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import styles from './styles/Item.css'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import ValidationStatus from 'part:@sanity/components/validation/status'
import PatchEvent, {set} from '../../PatchEvent'
import getEmptyValue from './getEmptyValue'
import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import DragHandleIcon from 'part:@sanity/base/drag-handle-icon'
import {Type, Marker} from '../../typedefs'
import {Path} from '../../typedefs/path'
const DragHandle = createDragHandle(() => (
  <span className={styles.dragHandle}>
    <Button icon={DragHandleIcon} kind="simple" />
  </span>
))
type Props = {
  type: Type
  onChange: (arg0: PatchEvent) => void
  onRemove: (arg0: number) => void
  onEnterKey: (arg0: number) => void
  onEscapeKey: (arg0: number) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  focusPath: Path
  markers: Array<Marker>
  index: number
  value: string | number | boolean
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
  handleKeyPress = event => {
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
      type,
      readOnly,
      isSortable,
      presence
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
            presence={presence}
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
