import {ChangeIndicatorScope} from '@sanity/base/lib/change-indicators'
import {ContextProvidedChangeIndicator} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {ArraySchemaType, isValidationMarker, Marker, Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {FormFieldPresence} from '@sanity/base/presence'
import React from 'react'
import PatchEvent from '../../../../PatchEvent'
import {ArrayMember} from '../types'
import {getItemType, hasFocusInPath, isEmpty, pathSegmentFrom} from './helpers'
import {EditDialog} from './EditDialog'
import {ItemRow} from './ItemRow'
import {ItemCell} from './ItemCell'

interface ArrayInputListItemProps {
  type: ArraySchemaType
  value: ArrayMember
  index: number
  compareValue?: any[]
  level: number
  markers: Marker[]
  layout?: 'media' | 'default'
  onRemove: (value: ArrayMember) => void
  onChange: (event: PatchEvent, value: ArrayMember) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  filterField: () => any
  readOnly: boolean
  focusPath: Path
  presence: FormFieldPresence[]
}

export class ArrayItem extends React.PureComponent<ArrayInputListItemProps> {
  _focusArea: HTMLDivElement | null = null

  innerElement: HTMLDivElement | null = null

  static defaultProps = {
    level: 0,
    markers: [],
  }

  componentDidMount() {
    const {focusPath, value} = this.props

    if (value._key && hasFocusInPath(focusPath, value)) {
      this.focus()
    }
  }

  componentDidUpdate(prevProps: ArrayInputListItemProps) {
    const hadFocus = hasFocusInPath(prevProps.focusPath, prevProps.value)
    const hasFocus = hasFocusInPath(this.props.focusPath, this.props.value)

    if (!hadFocus && hasFocus) {
      this.focus()
    }
  }

  handleEditStart = () => {
    this.setFocus([PathUtils.FOCUS_TERMINATOR])
  }

  handleFocus = () => {
    this.setFocus()
  }

  handleEditStop = () => {
    if (isEmpty(this.props.value)) {
      this.handleRemove()
    } else {
      this.setFocus()
    }
  }

  handleKeyPress = (event: React.KeyboardEvent<any>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.setFocus([PathUtils.FOCUS_TERMINATOR])
    }
  }

  handleRemove = () => {
    const {onRemove, value} = this.props

    onRemove(value)
  }

  handleChange = (event: PatchEvent, valueOverride?: ArrayMember) => {
    const {onChange, value} = this.props

    onChange(event, typeof valueOverride === 'undefined' ? value : valueOverride)
  }

  setFocus(path: Path = []) {
    const {value, onFocus} = this.props

    if (!value._key) {
      return
    }
    onFocus([{_key: value._key}, ...path])
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  setFocusArea = (el: HTMLDivElement | null) => {
    this._focusArea = el
  }

  setInnerElement = (el: HTMLDivElement | null) => {
    this.innerElement = el
  }

  render() {
    const {
      value,
      markers,
      type,
      index,
      readOnly,
      presence,
      focusPath,
      onFocus,
      onBlur,
      filterField,
      compareValue,
    } = this.props
    const options = type.options || {}
    const isSortable = !readOnly && !type.readOnly && options.sortable !== false
    const validation = markers.filter(isValidationMarker)
    const scopedValidation = validation.map((marker) => {
      if (marker.path.length <= 1) {
        return marker
      }
      const level = marker.level === 'error' ? 'errors' : 'warnings'
      return {...marker, item: marker.item.cloneWithMessage(`Contains ${level}`)}
    })

    const isOpen = PathUtils.isExpanded(pathSegmentFrom(value), focusPath)
    const itemType = getItemType(type, value)

    const LayoutComponent = type.options?.layout === 'grid' ? ItemCell : ItemRow

    return (
      <>
        <ChangeIndicatorScope path={[value._key ? {_key: value._key} : index]}>
          <ContextProvidedChangeIndicator compareDeep disabled={isOpen}>
            <LayoutComponent
              value={value}
              readOnly={readOnly}
              type={itemType}
              presence={isOpen ? [] : presence}
              validation={scopedValidation}
              isSortable={isSortable}
              onFocus={this.handleFocus}
              onClick={itemType && this.handleEditStart}
              onRemove={this.handleRemove}
              onKeyPress={this.handleKeyPress}
              ref={this.setInnerElement}
            />
          </ContextProvidedChangeIndicator>
        </ChangeIndicatorScope>

        {isOpen && itemType && (
          <EditDialog
            onChange={this.handleChange}
            onClose={this.handleEditStop}
            markers={markers}
            referenceElement={this.innerElement}
            filterField={filterField}
            focusPath={focusPath}
            onFocus={onFocus}
            onBlur={onBlur}
            type={itemType}
            dialogType={type?.options?.editModal || 'dialog'}
            value={value}
            readOnly={readOnly || itemType.readOnly || false}
            presence={presence}
            compareValue={compareValue}
          />
        )}
      </>
    )
  }
}
