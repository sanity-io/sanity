import React from 'react'
import {get} from 'lodash'
import {startsWith} from '@sanity/util/paths'
import {ArraySchemaType, Marker, Path, SchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import {FormFieldSet} from '@sanity/base/components'
import {FormFieldPresence} from '@sanity/base/lib/presence'
import {PatchEvent, set, unset} from '../../../PatchEvent'
import {resolveTypeName} from '../../../utils/resolveTypeName'
import {Item, List} from '../common/list'
import {ArrayFunctions} from '../../../legacyParts'
import getEmptyValue from './getEmptyValue'
import {ItemRow} from './ItemRow'

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
  type?: ArraySchemaType<Primitive>
  value: Primitive[]
  compareValue?: Primitive[]
  level: number
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  readOnly: boolean | null
  markers: Marker[]
  presence: FormFieldPresence[]
}
type Focusable = {focus: () => void}

export default class ArrayOfPrimitivesInput extends React.PureComponent<Props> {
  _element: Focusable | null = null
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
    const emptyValue = getEmptyValue(type)
    if (emptyValue === undefined) {
      throw new Error(`Cannot create empty primitive value from ${type.name}`)
    }
    this.set(insertAt(value, index, emptyValue))
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
    const firstType = this.props.type?.of[0]
    if (firstType) {
      this.insertAt(index, firstType)
      this._lastAddedIndex = index + 1
    }
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
    return type?.of.find(
      (memberType) => memberType.name === typeName || memberType.jsonType === typeName
    )
  }

  setElement = (el: Focusable | null) => {
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

  render() {
    const {
      type,
      value,
      level = 1,
      markers,
      readOnly,
      onChange,
      onFocus,
      presence,
      compareValue,
      focusPath,
      onBlur,
    } = this.props

    const isSortable = get(type, 'options.sortable') !== false

    return (
      <FormFieldSet
        title={type?.title}
        description={type?.description}
        level={level - 1}
        tabIndex={0}
        onFocus={onFocus}
        ref={this.setElement}
        presence={presence.filter((item) => item.path[0] === '$' || item.path.length === 0)}
        changeIndicator={false}
        markers={markers}
      >
        <Box>
          {value && value.length > 0 && (
            <List onSortEnd={this.handleSortEnd} isSortable={isSortable}>
              {value.map((item, index) => {
                const filteredMarkers = markers.filter((marker) => startsWith([index], marker.path))
                const childPresence = presence.filter((pItem) => startsWith([index], pItem.path))

                return (
                  <Item key={index} index={index} isSortable={isSortable}>
                    <ItemRow
                      level={level + 1}
                      index={index}
                      value={item}
                      compareValue={(compareValue || [])[index]}
                      readOnly={readOnly}
                      markers={filteredMarkers.length === 0 ? NO_MARKERS : filteredMarkers}
                      isSortable={isSortable}
                      type={this.getMemberType(resolveTypeName(item))}
                      focusPath={focusPath}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      onEnterKey={this.handleItemEnterKey}
                      onEscapeKey={this.handleItemEscapeKey}
                      onChange={this.handleItemChange}
                      onRemove={this.handleRemoveItem}
                      presence={childPresence}
                    />
                  </Item>
                )
              })}
            </List>
          )}
          <Box marginTop={1}>
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
          </Box>
        </Box>
      </FormFieldSet>
    )
  }
}
