// @flow
import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import styles from './styles/Item.css'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'

import PatchEvent, {set, unset} from '../../PatchEvent'
import getEmptyValue from './getEmptyValue'

import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import type {Type} from '../../typedefs'

const DragHandle = createDragHandle(() => <span className={styles.dragHandle}><DragBarsIcon /></span>)

type Props = {
  type: Type,
  onChange: PatchEvent => void,
  index: number,
  value: string | number | boolean,
  sortable: boolean,
  level: number
}
export default class Item extends React.PureComponent<Props> {

  handleRemove = () => {
    const {index, onChange} = this.props
    onChange(PatchEvent.from(unset([index])))
  }

  handleChange = (patchEvent: PatchEvent) => {
    const {onChange, type, index} = this.props
    onChange(PatchEvent.from(patchEvent.patches.map(patch => (
      // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
      (patch.path.length === 0 && patch.type === 'unset')
        ? set(getEmptyValue(type))
        : patch
    ))).prefixAll(index))
  }

  render() {
    const {value, level, type, sortable} = this.props
    return (
      <div className={styles.root}>
        {sortable && <DragHandle className={styles.dragHandle} />}
        <div className={styles.input}>
          <FormBuilderInput
            value={value}
            type={type}
            onChange={this.handleChange}
            level={level}
          />
        </div>
        <Button
          kind="simple"
          className={styles.deleteButton}
          color="danger"
          icon={TrashIcon}
          title="Delete"
          onClick={this.handleRemove}
        />
      </div>
    )
  }
}
