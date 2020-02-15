import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {Type} from '../../typedefs'
import styles from './styles/ArrayInput.css'
import {ArrayType, ItemValue} from './typedefs'
import PatchEvent from '../../PatchEvent'
import updateKeys from './updateKeys'

type Props = {
  type: ArrayType
  children: Node | null
  value: Array<ItemValue>
  readOnly: boolean | null
  onAppendItem: (itemValue: ItemValue) => void
  onPrependItem: (itemValue: ItemValue) => void
  onFocusItem: (item: ItemValue) => void
  onCreateValue: (type: Type) => ItemValue
  onChange: (event: PatchEvent) => void
}

export default class ArrayFunctions extends React.Component<Props, {}> {
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
  handleDuplicateBtnClick = (menuItem: {item: Record<string, any>}) => {
    this.handleDuplicateItem(menuItem.item)
  }
  handleDuplicateItem = item => {
    const {onAppendItem} = this.props
    const newItem = item.hasOwnProperty('_key') ? updateKeys(Object.assign({}, item), '_key') : item
    onAppendItem(newItem)
  }
  renderSelectDuplicate() {
    const items = this.props.value.map(item => ({
      title: item.title || item.name || item.where,
      item: item
    }))
    return (
      <DropDownButton inverted items={items} onAction={this.handleDuplicateBtnClick}>
        Duplicate
      </DropDownButton>
    )
  }
  renderSelectType() {
    const items = this.props.type.of.map(memberDef => ({
      title: memberDef.title || memberDef.type.name,
      type: memberDef
    }))
    return (
      <DropDownButton inverted items={items} onAction={this.handleDropDownAction}>
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
        <ButtonGrid align="start">
          {type.of.length === 1 ? (
            <Button inverted onClick={this.handleAddBtnClick}>
              Add
            </Button>
          ) : (
            this.renderSelectType()
          )}
          {this.props.type.options?.canDuplicate && this.renderSelectDuplicate()}
          {children || null}
        </ButtonGrid>
      </div>
    )
  }
}
