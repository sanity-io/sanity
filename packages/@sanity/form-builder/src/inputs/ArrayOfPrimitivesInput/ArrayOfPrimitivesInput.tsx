import React from 'react'
import {get} from 'lodash'
import {startsWith} from '@sanity/util/paths'
import {ArraySchemaType, Marker, Path, SchemaType} from '@sanity/types'
import {Item as DefaultItem, List as DefaultList} from 'part:@sanity/components/lists/default'
import {Item as SortableItem, List as SortableList} from 'part:@sanity/components/lists/sortable'
import ArrayFunctions from 'part:@sanity/form-builder/input/array/functions'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, set, unset} from '../../PatchEvent'
import {resolveTypeName} from '../../utils/resolveTypeName'
import Warning from '../Warning'
import getEmptyValue from './getEmptyValue'
import Item from './Item'
import {Button} from '@sanity/ui'

import styles from './ArrayOfPrimitivesInput.css'

type Primitive = string | number | boolean

const NO_MARKERS: Marker[] = []

function move(arr: Primitive[], from: number, to: number): Primitive[] {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

function insertAt(arr: Primitive[], index: number, item: Primitive): Primitive[] {
  const copy = arr.slice()
  copy.splice(index + 1, 0, item)
  return copy
}

type Props = {
  type: ArraySchemaType<Primitive>
  value: Primitive[]
  compareValue?: Primitive[]
  level: number
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  readOnly: boolean | null
  markers: Marker[]
  presence: any
}

export default class ArrayOfPrimitivesInput extends React.PureComponent<Props> {
  _element: Fieldset | null
  _lastAddedIndex = -1

  set(nextValue: Primitive[]) {
    this._lastAddedIndex = -1
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }

  removeAt(index: number) {
    const {value = []} = this.props
    this.set(value.filter((_, i) => i !== index))
    this.props.onFocus([Math.max(0, index - 1)])
  }

  handleAppend = (itemValue: Primitive) => {
    const {value = [], onFocus} = this.props
    this.set(value.concat(itemValue))
    onFocus([value.length])
  }

  handlePrepend = (itemValue: Primitive) => {
    const {value = [], onFocus} = this.props
    this.set([itemValue].concat(value))
    onFocus([value.length])
  }

  insertAt(index: number, type: SchemaType) {
    const {value = [], onFocus} = this.props
    this.set(insertAt(value, index, getEmptyValue(type)))
    onFocus([index + 1])
  }

  handleRemoveItem = (index: number) => {
    this.removeAt(index)
  }

  handleItemChange = (event: PatchEvent) => {
    this._lastAddedIndex = -1
    this.props.onChange(event)
  }

  handleItemEnterKey = (index: number) => {
    this.insertAt(index, this.props.type.of[0])
    this._lastAddedIndex = index + 1
  }

  handleItemEscapeKey = (index: number) => {
    const {value} = this.props
    if (index === this._lastAddedIndex && value[index] === '') {
      this.removeAt(index)
    }
  }

  handleSortEnd = (event: {oldIndex: number; newIndex: number}) => {
    const {value} = this.props
    const {oldIndex, newIndex} = event
    this.set(move(value, oldIndex, newIndex))
  }

  getMemberType(typeName: string) {
    const {type} = this.props
    return type.of.find(
      (memberType) => memberType.name === typeName || memberType.jsonType === typeName
    )
  }

  renderItem = (item: Primitive, index: number) => {
    const {
      type,
      level = 1,
      markers,
      compareValue,
      focusPath,
      onFocus,
      readOnly,
      onBlur,
      presence,
    } = this.props

    const typeName = resolveTypeName(item)
    const itemMemberType = this.getMemberType(typeName)
    if (!itemMemberType) {
      return null
    }

    const isSortable = get(type, 'options.sortable') !== false
    const ListItem = isSortable ? SortableItem : DefaultItem
    const filteredMarkers = markers.filter((marker) => startsWith([index], marker.path))
    const childPresence = presence.filter((pItem) => startsWith([index], pItem.path))

    return (
      <ListItem key={index} index={index} className={styles.item}>
        <Item
          level={level + 1}
          index={index}
          value={item}
          compareValue={(compareValue || [])[index]}
          readOnly={readOnly}
          markers={filteredMarkers.length === 0 ? NO_MARKERS : filteredMarkers}
          isSortable={isSortable}
          type={itemMemberType}
          focusPath={focusPath}
          onFocus={onFocus}
          onBlur={onBlur}
          onEnterKey={this.handleItemEnterKey}
          onEscapeKey={this.handleItemEscapeKey}
          onChange={this.handleItemChange}
          onRemove={this.handleRemoveItem}
          presence={childPresence}
        />
      </ListItem>
    )
  }

  renderList(value: Primitive[]) {
    const {type} = this.props
    const isSortable = get(type, 'options.sortable') !== false
    return isSortable ? (
      <SortableList
        className={styles.list}
        onSortEnd={this.handleSortEnd}
        helperClass="ArrayOfPrimitivesInput__moving"
        useDragHandle
      >
        {value.map(this.renderItem)}
      </SortableList>
    ) : (
      <DefaultList decoration="divider">{value.map(this.renderItem)}</DefaultList>
    )
  }

  setElement = (el: Fieldset | null) => {
    this._element = el
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  handleFocusItem = (index: number) => {
    this.props.onFocus([index])
  }

  renderUnknownValueTypes = () => {
    const {value, readOnly} = this.props

    // Find values with types not specified in the schema
    const unknownValues = (value || [])
      .filter((v) => {
        const typeName = resolveTypeName(v)
        const itemMemberType = this.getMemberType(typeName)
        return !itemMemberType
      })
      .map((v) => ({value: v, type: resolveTypeName(v)}))

    if (!unknownValues || unknownValues.length === 0) {
      return null
    }

    const message = (
      <>
        <p>
          These are not defined in the current schema as valid types for this array. This could mean
          that the type has been removed, or that someone else has added it to their own local
          schema that is not yet deployed.
        </p>

        {unknownValues.map((item) => (
          <div key={item.type}>
            <h4>{item.type}</h4>
            <pre className={styles.inspectValue}>{JSON.stringify(item.value, null, 2)}</pre>
            {readOnly ? (
              <div>
                This array is <em>read only</em> according to its enclosing schema type and values
                cannot be unset. If you want to unset a value, make sure you remove the{' '}
                <strong>readOnly</strong> property from the enclosing type.
              </div>
            ) : (
              <Button
                onClick={() => this.handleRemoveItem(value.findIndex((v) => v === item.value))}
                tone="critical"
                text={`Unset ${item.value}`}
              />
            )}
          </div>
        ))}
      </>
    )

    return (
      <div className={styles.unknownValueTypes}>
        <Warning values={unknownValues} message={message} />
      </div>
    )
  }

  render() {
    const {type, value, level = 1, markers, readOnly, onChange, onFocus, presence} = this.props

    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level - 1}
        tabIndex={0}
        onFocus={onFocus}
        ref={this.setElement}
        markers={markers}
        presence={presence.filter((item) => item.path[0] === '$' || item.path.length === 0)}
        changeIndicator={false}
      >
        <div className={styles.root}>
          {value && value.length > 0 && <div className={styles.list}>{this.renderList(value)}</div>}
          {this.renderUnknownValueTypes()}
          <div className={styles.functions}>
            <ArrayFunctions
              type={type}
              value={value}
              readOnly={readOnly}
              onAppendItem={this.handleAppend}
              onPrependItem={this.handlePrepend}
              onFocusItem={this.handleFocusItem}
              onCreateValue={getEmptyValue}
              onChange={onChange}
            />
          </div>
        </div>
      </Fieldset>
    )
  }
}
