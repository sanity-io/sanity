import PropTypes from 'prop-types'
// @flow
import React from 'react'
import {get} from 'lodash'
import {List as DefaultList, Item as DefaultItem} from 'part:@sanity/components/lists/default'
import {List as SortableList, Item as SortableItem} from 'part:@sanity/components/lists/sortable'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Button from 'part:@sanity/components/buttons/default'
import Item from './Item'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import styles from './styles/ArrayOfPrimitives.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import getEmptyValue from './getEmptyValue'

import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValue'

function move(arr, from, to) {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

export default class ArrayOfPrimitivesInput extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool
    ])),
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  set(nextValue: any[]) {
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }

  removeAt(index: number) {
    this.set(this.props.value.filter((_, i) => i !== index))
  }

  append(type) {
    this.set((this.props.value || []).concat(getEmptyValue(type)))
  }

  handleRemoveItem = (index: number) => {
    this.removeAt(index)
  }

  handleDropDownAction = action => {
    this.append(action.type)
  }

  handleAddBtnClick = () => {
    this.append(this.props.type.of[0])
  }

  handleItemChange = event => {
    this.props.onChange(event)
  }

  handleSort = event => {
    const {value} = this.props
    const {oldIndex, newIndex} = event
    this.set(move(value, oldIndex, newIndex))
  }

  getMemberType(typeName) {
    const {type} = this.props
    return type.of.find(memberType => memberType.name === typeName)
  }

  renderItem = (item, index) => {
    const {type, level, value, onChange} = this.props

    const typeName = resolveTypeName(item)
    const itemMemberType = this.getMemberType(typeName)

    if (!itemMemberType) {
      return (
        <InvalidValue
          key={index}
          actualType={typeName}
          validTypes={type.of.map(memberType => memberType.name)}
          onChange={ev => onChange(ev.prefixAll(index))}
          value={value}
        />
      )
    }

    const sortable = get(type, 'options.sortable') !== false
    const ListItem = sortable ? SortableItem : DefaultItem
    return (
      <ListItem key={index} index={index}>
        <Item
          level={level + 1}
          index={index}
          value={item}
          sortable={sortable}
          type={itemMemberType}
          onChange={this.handleItemChange}
          onRemove={this.handleRemoveItem}
        />
      </ListItem>
    )
  }

  renderList(value) {
    const {type} = this.props
    const isSortable = get(type, 'options.sortable') !== false
    return isSortable
      ? (
        <SortableList onSort={this.handleSort} movingItemClass={styles.movingItem} useDragHandle>
          {value.map(this.renderItem)}
        </SortableList>
      )
      : (
        <DefaultList decoration="divider">
          {value.map(this.renderItem)}
        </DefaultList>
      )

  }

  renderSelectType() {
    const {type} = this.props

    const items = type.of.map(memberDef => ({
      title: memberDef.title || memberDef.type.name,
      type: memberDef
    }))

    return (
      <DropDownButton items={items} color="primary" onAction={this.handleDropDownAction}>
        New {this.props.type.title}
      </DropDownButton>
    )
  }

  render() {
    const {type, value, level} = this.props
    return (
      <Fieldset legend={type.title} description={type.description} level={level}>
        <div className={styles.root}>
          {value && value.length > 0 && (
            <div className={styles.list}>
              {this.renderList(value)}
            </div>
          )}
          <div className={styles.functions}>
            {this.props.type.of.length === 1 ? (
              <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
                Add
              </Button>
            ) : this.renderSelectType()}
          </div>
        </div>
      </Fieldset>
    )
  }
}
