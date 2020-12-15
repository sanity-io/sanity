import {ChangeIndicatorScope} from '@sanity/base/lib/change-indicators'
import {ContextProvidedChangeIndicator} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {ArraySchemaType, isValidationMarker, Marker, Path, SchemaType} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {LinkIcon, DragHandleIcon} from '@sanity/icons'
import {FormFieldPresence, FieldPresence, PresenceOverlay} from '@sanity/base/presence'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import ValidationStatus from 'part:@sanity/components/validation/status'
import React from 'react'
import {FormBuilderInput} from '../../../FormBuilderInput'
import PatchEvent from '../../../PatchEvent'
import Preview from '../../../Preview'
import {resolveTypeName} from '../../../utils/resolveTypeName'
import {ConfirmDeleteButton} from '../ConfirmDeleteButton'
import {ItemValue} from '../typedefs'
import InvalidItem from '../InvalidItem'
import {IntentButton} from '../../../components/IntentButton'
import {hasFocusInPath, isEmpty, pathSegmentFrom} from './helpers'
import {Button} from '@sanity/ui'

import styles from './ArrayInputGridItem.css'

interface ArrayInputGridItemProps {
  type: ArraySchemaType
  value: ItemValue
  index: number
  compareValue?: any[]
  level: number
  markers: Array<Marker>
  layout?: 'media' | 'default'
  onRemove: (arg0: ItemValue) => void
  onChange: (event: PatchEvent, arg1: ItemValue) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  filterField: () => any
  readOnly: boolean | null
  focusPath: Path
  presence: FormFieldPresence[]
}

const DragHandle = createDragHandle(() => (
  <span className={styles.dragHandle}>
    <Button aria-hidden="true" icon={DragHandleIcon} mode="bleed" padding={2} tabIndex={-1} />
  </span>
))

export class ArrayInputGridItem extends React.PureComponent<ArrayInputGridItemProps> {
  _focusArea: HTMLDivElement | null

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

  componentDidUpdate(prevProps: ArrayInputGridItemProps) {
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

  handleChange = (event: PatchEvent, valueOverride?: ItemValue) => {
    const {onChange, value} = this.props

    onChange(event, typeof valueOverride === 'undefined' ? value : valueOverride)
  }

  getMemberType(): SchemaType | null {
    const {value, type} = this.props
    const itemTypeName = resolveTypeName(value)

    return itemTypeName === 'object' && type.of.length === 1
      ? type.of[0]
      : type.of.find((memberType) => memberType.name === itemTypeName)
  }

  getTitle(): string {
    const {readOnly} = this.props
    const memberType = this.getMemberType()

    if (readOnly || memberType.readOnly) {
      return memberType.title || ''
    }

    return memberType.title ? `Edit ${memberType.title}` : 'Edit'
  }

  setFocus(path: Path = []) {
    const {value, onFocus} = this.props
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

  renderEditItemForm(item: ItemValue) {
    const {
      type,
      markers,
      focusPath,
      onFocus,
      onBlur,
      index,
      readOnly,
      filterField,
      presence,
      compareValue,
    } = this.props
    const options = type.options || {}
    const memberType = this.getMemberType()
    const childMarkers = markers.filter((marker) => marker.path.length > 1)
    const childPresence = presence.filter((_presence) => _presence.path.length > 1)
    const content = (
      <FormBuilderInput
        type={memberType}
        level={0}
        value={isEmpty(item) ? undefined : item}
        onChange={this.handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        compareValue={compareValue}
        focusPath={focusPath}
        readOnly={readOnly || memberType.readOnly}
        markers={childMarkers}
        path={[item._key ? {_key: item._key} : index]}
        filterField={filterField}
        presence={childPresence}
      />
    )

    // NOTE: Test focus issues by uncommenting the next line
    // return content

    const title = this.getTitle()

    if (options.editModal === 'fullscreen') {
      return (
        <FullscreenDialog title={title} onClose={this.handleEditStop} isOpen>
          {content}
        </FullscreenDialog>
      )
    }

    if (options.editModal === 'fold') {
      return (
        <div>
          <EditItemFold title={title} onClose={this.handleEditStop}>
            <PresenceOverlay margins={[0, 0, 1, 0]}>{content}</PresenceOverlay>
          </EditItemFold>
        </div>
      )
    }

    if (options.editModal === 'popover') {
      return (
        <div className={styles.popupAnchor}>
          <PopoverDialog
            depth={10}
            title={title}
            onClose={this.handleEditStop}
            onEscape={this.handleEditStop}
            onClickOutside={this.handleEditStop}
            placement="bottom"
          >
            <PresenceOverlay margins={[0, 0, 1, 0]}>{content}</PresenceOverlay>
          </PopoverDialog>
        </div>
      )
    }

    return (
      <DefaultDialog onClose={this.handleEditStop} key={item._key || index} title={title}>
        <PresenceOverlay margins={[0, 0, 1, 0]}>{content}</PresenceOverlay>
      </DefaultDialog>
    )
  }

  renderItem() {
    const {value, markers, type, index, readOnly, presence, focusPath} = this.props
    const options = type.options || {}
    const isSortable = !readOnly && !type.readOnly && options.sortable !== false
    const validation = markers.filter(isValidationMarker)
    const scopedValidation = validation
      .map((marker) => {
        if (marker.path.length <= 1) {
          return marker
        }
        const level = marker.level === 'error' ? 'errors' : 'warnings'
        return Object.assign({}, marker, {
          item: marker.item.cloneWithMessage(`Contains ${level}`),
        })
      })
      .filter(Boolean)
    const hasItemFocus = PathUtils.isExpanded(pathSegmentFrom(value), focusPath)
    const memberType = this.getMemberType()

    if (!memberType) {
      return <InvalidItem onChange={this.handleChange} type={type} value={value} />
    }

    return (
      <ChangeIndicatorScope path={[value._key ? {_key: value._key} : index]}>
        <ContextProvidedChangeIndicator compareDeep disabled={hasItemFocus}>
          <div className={styles.inner}>
            <div
              tabIndex={0}
              onClick={value._key && this.handleEditStart}
              onKeyPress={this.handleKeyPress}
              className={styles.previewWrapper}
            >
              <div
                tabIndex={-1}
                ref={this.setFocusArea}
                className={styles.previewWrapperHelper}
                onFocus={this.handleFocus}
              >
                {!value._key && <div className={styles.missingKeyMessage}>Missing key</div>}
                <Preview layout="media" value={value} type={memberType} />
              </div>

              {!readOnly && (
                <div className={styles.presenceContainer}>
                  <FieldPresence presence={hasItemFocus ? [] : presence} maxAvatars={1} />
                </div>
              )}
            </div>

            {!readOnly && (
              <div className={styles.footer}>
                <div className={styles.dragHandleContainer}>{isSortable && <DragHandle />}</div>

                <div className={styles.functions}>
                  <div>
                    <ValidationStatus
                      markers={scopedValidation}
                      placement="bottom"
                      showSummary={!value._ref}
                    />
                  </div>

                  {value._ref && (
                    <div>
                      <IntentButton icon={LinkIcon} intent="edit" params={{id: value._ref}} />
                    </div>
                  )}

                  <div>
                    <ConfirmDeleteButton
                      onConfirm={this.handleRemove}
                      placement="bottom"
                      title="Remove item"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ContextProvidedChangeIndicator>
      </ChangeIndicatorScope>
    )
  }

  render() {
    const {value, focusPath} = this.props
    const isExpanded = PathUtils.isExpanded(value, focusPath)

    return (
      <div className={styles.root}>
        {this.renderItem()}
        {isExpanded && this.renderEditItemForm(value)}
      </div>
    )
  }
}
