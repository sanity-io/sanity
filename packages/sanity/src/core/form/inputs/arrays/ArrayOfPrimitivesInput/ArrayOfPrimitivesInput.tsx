import React from 'react'
import {get} from 'lodash'
import {ArraySchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {ArrayOfPrimitivesInputProps, FormArrayInputFunctionsProps} from '../../../types'
import {Item, List} from '../common/list'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {ArrayOfPrimitivesItem} from '../../../members'
import {ErrorItem} from '../ArrayOfObjectsInput/List/ErrorItem'
import {UploadTargetCard} from '../common/UploadTargetCard'
import {getEmptyValue} from './getEmptyValue'

import {PrimitiveValue} from './types'
import {nearestIndexOf} from './utils/nearestIndex'
import {ItemRow} from './ItemRow'
import {ArrayOfPrimitivesFunctions} from './ArrayOfPrimitivesFunctions'

export interface DefaultArrayOfPrimitivesInputProps extends ArrayOfPrimitivesInputProps {
  ArrayFunctionsImpl: React.ComponentType<
    FormArrayInputFunctionsProps<ArraySchemaType<PrimitiveValue[]>, PrimitiveValue>
  >
}
// Note: this should be a class component until React provides support for a hook version of getSnapshotBeforeUpdate
/** @public */
export class ArrayOfPrimitivesInput extends React.PureComponent<DefaultArrayOfPrimitivesInputProps> {
  _element: HTMLElement | null = null
  _lastAddedIndex = -1

  handleAppend = (itemValue: PrimitiveValue) => {
    const {value = [], onFocusIndex, onAppendItem} = this.props
    onAppendItem(itemValue)
    onFocusIndex(value.length)
  }

  handlePrepend = (itemValue: PrimitiveValue) => {
    const {onFocusIndex, value = [], onPrependItem} = this.props
    onPrependItem(itemValue)
    onFocusIndex(value.length)
  }
  handleItemEnterKey = (index: number) => {
    const {schemaType, onInsert} = this.props
    const firstType = schemaType?.of[0]
    if (firstType) {
      onInsert({
        referenceIndex: index,
        position: 'after',
        items: [getEmptyValue(firstType)],
      })
      this._lastAddedIndex = index + 1
    }
  }

  handleItemEscapeKey = (index: number) => {
    const {value, onRemoveItem} = this.props
    if (index === this._lastAddedIndex && value?.[index] === '') {
      onRemoveItem(index)
    }
  }

  handleSortEnd = (event: {fromIndex: number; toIndex: number}) => {
    const {onFocusIndex, onMoveItem, value} = this.props
    if (value) onMoveItem(event)
    onFocusIndex(event.toIndex)
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  getSnapshotBeforeUpdate(prevProps: ArrayOfPrimitivesInputProps) {
    const {focusPath: prevFocusPath = [], value: prevValue = []} = prevProps
    const {focusPath = [], value = []} = this.props
    if (prevFocusPath[0] === focusPath[0] && prevValue.length !== value.length) {
      // the length of the array has changed, but the focus path has not, which may happen if someone inserts or removes a new item above the one currently in focus
      const focusIndex = focusPath[0]

      const selection = window.getSelection()
      if (!(selection?.focusNode instanceof HTMLElement)) {
        return null
      }

      const input = selection.focusNode?.querySelector('input,textarea')

      return input instanceof HTMLInputElement
        ? {
            prevFocusedIndex: focusIndex,
            restoreSelection: {
              text: selection.toString(),
              start: input.selectionStart,
              end: input.selectionEnd,
              value: input.value,
            },
          }
        : {}
    }

    return null
  }

  componentDidUpdate(
    prevProps: ArrayOfPrimitivesInputProps,
    prevState: Record<string, unknown>,
    snapshot?: {restoreSelection: {start: number; end: number}; prevFocusedIndex: number}
  ) {
    const {onFocusIndex} = this.props
    if (snapshot?.restoreSelection && prevProps.value) {
      const prevFocusedValue = prevProps.value[snapshot.prevFocusedIndex]

      const nearestIndex = nearestIndexOf(
        this.props.value || [],
        snapshot.prevFocusedIndex,
        prevFocusedValue
      )

      if (nearestIndex === -1) {
        return
      }
      const newInput = this._element?.querySelector(
        `[data-item-index='${nearestIndex}'] input,textarea`
      )

      if (newInput instanceof HTMLInputElement) {
        newInput.focus()
        try {
          newInput.setSelectionRange(snapshot.restoreSelection.start, snapshot.restoreSelection.end)
        } catch {
          // not all inputs supports selection (e.g. <input type="number" />)
        }
      }
      onFocusIndex(nearestIndex)
    }
  }

  renderArrayItem = (props: Omit<PrimitiveItemProps, 'renderDefault'>) => {
    const {schemaType} = this.props
    const sortable = schemaType.options?.sortable !== false
    return (
      <ItemRow
        {...props}
        sortable={sortable}
        insertableTypes={schemaType.of}
        onEnterKey={this.handleItemEnterKey}
        onEscapeKey={this.handleItemEscapeKey}
      />
    )
  }

  render() {
    const {
      schemaType,
      members,
      readOnly,
      value,
      onChange,
      renderInput,
      onUpload,
      resolveUploader,
      elementProps,
    } = this.props

    const isSortable = !readOnly && get(schemaType, 'options.sortable') !== false

    return (
      <Stack space={3} data-testid="array-primitives-input">
        <UploadTargetCard
          types={schemaType.of}
          resolveUploader={resolveUploader}
          onUpload={onUpload}
          {...elementProps}
          tabIndex={0}
        >
          <Stack space={1}>
            {members.length === 0 ? (
              <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
                <Text align="center" muted size={1}>
                  {schemaType.placeholder || <>No items</>}
                </Text>
              </Card>
            ) : (
              <Card padding={1} border>
                <List onItemMove={this.handleSortEnd} sortable={isSortable} gap={1}>
                  {members.map((member, index) => {
                    return (
                      <Item key={member.key} sortable={isSortable} index={index}>
                        {member.kind === 'item' && (
                          <ArrayOfPrimitivesItem
                            member={member}
                            renderItem={this.renderArrayItem}
                            renderInput={renderInput}
                          />
                        )}
                        {member.kind === 'error' && (
                          <ErrorItem sortable={isSortable} member={member} />
                        )}
                      </Item>
                    )
                  })}
                </List>
              </Card>
            )}
          </Stack>
        </UploadTargetCard>

        <ArrayOfPrimitivesFunctions
          type={schemaType}
          value={value}
          readOnly={readOnly}
          onAppendItem={this.handleAppend}
          onPrependItem={this.handlePrepend}
          onCreateValue={getEmptyValue}
          onChange={onChange}
        />
      </Stack>
    )
  }
}
