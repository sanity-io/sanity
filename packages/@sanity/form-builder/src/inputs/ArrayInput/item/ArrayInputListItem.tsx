import {ChangeIndicatorScope} from '@sanity/base/lib/change-indicators'
import {ContextProvidedChangeIndicator} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {ArraySchemaType, isValidationMarker, Marker, Path, SchemaType} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {LinkIcon, DragHandleIcon} from '@sanity/icons'
import {FieldPresence, FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import ValidationStatus from 'part:@sanity/components/validation/status'
import React from 'react'
import {Box, Dialog, Layer, Button} from '@sanity/ui'
import {FormBuilderInput} from '../../../FormBuilderInput'
import PatchEvent from '../../../PatchEvent'
import Preview from '../../../Preview'
import {resolveTypeName} from '../../../utils/resolveTypeName'
import {ConfirmDeleteButton} from '../ConfirmDeleteButton'
import {ItemValue} from '../typedefs'
import InvalidItem from '../InvalidItem'
import {PopoverDialog} from '../../../components/PopoverDialog'
import {IntentButton} from '../../../components/IntentButton'
import {hasFocusInPath, isEmpty, pathSegmentFrom} from './helpers'
import {BorderShadowGridItem, PreviewWrapper} from './styles'

import styles from './ArrayInputListItem.css'
import {DragHandle} from './DragHandle'

const dragHandle = <DragHandle />

interface ArrayInputListItemProps {
  type: ArraySchemaType
  value: ItemValue
  index: number
  compareValue?: any[]
  level: number
  markers: Marker[]
  layout?: 'media' | 'default'
  onRemove: (value: ItemValue) => void
  onChange: (event: PatchEvent, value: ItemValue) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  filterField: () => any
  readOnly: boolean | null
  focusPath: Path
  presence: FormFieldPresence[]
}

export class ArrayInputListItem extends React.PureComponent<ArrayInputListItemProps> {
  _focusArea: HTMLDivElement | null

  innerElement: HTMLDivElement | null

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
        <Layer>
          <Dialog
            width="auto"
            id={item._key}
            onClose={this.handleEditStop}
            key={item._key}
            header={title}
            position="absolute"
          >
            <PresenceOverlay margins={[0, 0, 1, 0]}>
              <Box padding={4}>{content}</Box>
            </PresenceOverlay>
          </Dialog>
        </Layer>
      )
    }

    // TODO(@benedicteb, 2020-12-04) Make a plan for what to do with fold
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
        <PopoverDialog
          onClose={this.handleEditStop}
          referenceElement={this.innerElement}
          placement="auto"
          depth={10}
        >
          <PresenceOverlay margins={[0, 0, 1, 0]}>{content}</PresenceOverlay>
        </PopoverDialog>
      )
    }

    return (
      <Layer>
        <Dialog
          width={1}
          id={item._key}
          onClose={this.handleEditStop}
          key={item._key}
          header={title}
          position="absolute"
        >
          <PresenceOverlay margins={[0, 0, 1, 0]}>
            <Box padding={4}>{content}</Box>
          </PresenceOverlay>
        </Dialog>
      </Layer>
    )
  }

  setInnerElement = (el: HTMLDivElement | null) => {
    this.innerElement = el
  }

  renderItem() {
    const {value, markers, type, index, readOnly, presence, focusPath} = this.props
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

    const hasItemFocus = PathUtils.isExpanded(pathSegmentFrom(value), focusPath)
    const memberType = this.getMemberType()

    if (!memberType) {
      return <InvalidItem onChange={this.handleChange} type={type} value={value} />
    }

    // TODO(@benedicteb, 2020-12-14) Remove alignItems: center when Box has support for it
    return (
      <ChangeIndicatorScope path={[value._key ? {_key: value._key} : index]}>
        <ContextProvidedChangeIndicator compareDeep disabled={hasItemFocus}>
          <BorderShadowGridItem>
            <Box display="flex" style={{alignItems: 'center'}} ref={this.setInnerElement}>
              {isSortable && dragHandle}

              <PreviewWrapper
                tabIndex={0}
                onClick={value._key && this.handleEditStart}
                onKeyPress={this.handleKeyPress}
              >
                <div
                  tabIndex={-1}
                  ref={this.setFocusArea}
                  className={styles.previewWrapperHelper}
                  onFocus={this.handleFocus}
                >
                  {!value._key && <div className={styles.missingKeyMessage}>Missing key</div>}
                  <Preview layout="default" value={value} type={memberType} />
                </div>
              </PreviewWrapper>

              <div className={styles.functions}>
                {!readOnly && (
                  <div className={styles.presenceContainer}>
                    <FieldPresence presence={hasItemFocus ? [] : presence} maxAvatars={1} />
                  </div>
                )}

                {!readOnly && (
                  <div className={styles.validationStatusContainer}>
                    <ValidationStatus markers={scopedValidation} showSummary={!value._ref} />
                  </div>
                )}

                <div className={styles.editButtonContainer}>
                  {value._ref && (
                    <IntentButton
                      icon={LinkIcon}
                      intent="edit"
                      mode="bleed"
                      padding={2}
                      params={{id: value._ref}}
                    />
                  )}
                </div>

                {!readOnly && (
                  <div className={styles.removeButtonContainer}>
                    <ConfirmDeleteButton
                      placement="left"
                      title="Remove item"
                      onConfirm={this.handleRemove}
                    />
                  </div>
                )}
              </div>
            </Box>
          </BorderShadowGridItem>
        </ContextProvidedChangeIndicator>
      </ChangeIndicatorScope>
    )
  }

  render() {
    const {value, focusPath} = this.props
    const isExpanded = PathUtils.isExpanded(value, focusPath)

    return (
      <>
        {this.renderItem()}
        {isExpanded && this.renderEditItemForm(value)}
      </>
    )
  }
}
