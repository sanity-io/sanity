import {ArraySchemaType, SchemaType, isReferenceSchemaType} from '@sanity/types'
import classNames from 'classnames'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import React from 'react'
import PatchEvent from '../../PatchEvent'
import {ItemValue} from './typedefs'

import styles from './ArrayFunctions.css'

interface ArrayFunctionsProps {
  className?: string
  type: ArraySchemaType
  children: Node | null
  value: ItemValue[]
  readOnly: boolean | null
  onAppendItem: (itemValue: ItemValue) => void
  onPrependItem: (itemValue: ItemValue) => void
  onFocusItem: (item: ItemValue) => void
  onCreateValue: (type: SchemaType) => ItemValue
  onChange: (event: PatchEvent) => void
}

export default class ArrayFunctions extends React.Component<ArrayFunctionsProps> {
  static __SANITY_INTERNAL_IMPLEMENTATION = true

  handleDropDownAction = (menuItem: {type: SchemaType}) => {
    this.handleInsertItem(menuItem.type)
  }

  handleAddBtnClick = () => {
    this.handleInsertItem(this.props.type.of[0])
  }

  handleInsertItem = (type) => {
    const {onCreateValue, onAppendItem} = this.props
    const item = onCreateValue(type)

    onAppendItem(item)
  }

  renderSelectType() {
    const items = this.props.type.of.map((memberDef) => {
      // Use reference icon if reference is to one type only
      const referenceIcon =
        isReferenceSchemaType(memberDef) &&
        (memberDef.to || []).length === 1 &&
        memberDef.to[0].icon

      const icon = memberDef.icon || memberDef.type.icon || referenceIcon
      return {
        title: memberDef.title || memberDef.type.name,
        type: memberDef,
        icon,
      }
    })

    return (
      <DropDownButton inverted items={items} onAction={this.handleDropDownAction}>
        Add
      </DropDownButton>
    )
  }

  render() {
    const {className, type, readOnly, children} = this.props

    if (readOnly) {
      return null
    }

    return (
      <div className={classNames(styles.root, className)}>
        <ButtonGrid align="start">
          {type.of.length === 1 ? (
            <Button inverted onClick={this.handleAddBtnClick}>
              Add
            </Button>
          ) : (
            this.renderSelectType()
          )}

          {children || null}
        </ButtonGrid>
      </div>
    )
  }
}
