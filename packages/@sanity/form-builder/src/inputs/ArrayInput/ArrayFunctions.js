// @flow
import React from 'react'
import type {Node} from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import ButtonsCollection from 'part:@sanity/components/buttons/button-collection'
import type {Type} from '../../typedefs'
import styles from './styles/ArrayInput.css'
import type {ArrayType, ItemValue} from './typedefs'

type Props = {
  type: ArrayType,
  children: ?Node,
  value: Array<ItemValue>,
  readOnly: ?boolean,
  onAppendItem: (itemValue: ItemValue) => void,
  onPrependItem: (itemValue: ItemValue) => void,
  onFocusItem: (item: ItemValue) => void,
  onCreateValue: (type: Type) => ItemValue,
  onChange: (event: PatchEvent) => void
}

export default class ArrayFunctions extends React.Component<Props> {
  handleDropDownAction = (menuItem: {type: Type}) => {
    this.handleInsertItem(menuItem.type)
  }

  handleAddBtnClick = () => {
    this.handleInsertItem(this.props.type.of[0])
  }

  handleInsertItem = type => {
    const {onCreateValue, onAppendItem} = this.props
    const item = onCreateValue(type)
    onAppendItem(item)
  }

  renderSelectType() {
    const items = this.props.type.of.map(memberDef => ({
      title: memberDef.title || memberDef.type.name,
      type: memberDef
    }))

    return (
      <DropDownButton items={items} onAction={this.handleDropDownAction}>
        Add
      </DropDownButton>
    )
  }

  render() {
    const {type, readOnly, children} = this.props
    if (readOnly) {
      return null
    }

    return (
      <div className={styles.functions}>
        <ButtonsCollection align="start">
          {type.of.length === 1 ? (
            <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
              Add
            </Button>
          ) : (
            this.renderSelectType()
          )}

          {children || null}
        </ButtonsCollection>
      </div>
    )
  }
}
