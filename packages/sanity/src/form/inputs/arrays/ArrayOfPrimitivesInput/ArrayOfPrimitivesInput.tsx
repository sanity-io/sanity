import React from 'react'
import {get} from 'lodash'
import {ArraySchemaType} from '@sanity/types'
import {Card, Stack} from '@sanity/ui'
import {ArrayOfPrimitivesInputProps, FormArrayInputFunctionsProps} from '../../../types'
import {Item, List} from '../common/list'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {MemberItemError} from '../../../members'
import {getEmptyValue} from './getEmptyValue'

import {PrimitiveValue} from './types'
import {nearestIndexOf} from './utils/nearestIndex'
import {PrimitiveMemberItem} from './PrimitiveMemberItem'
import {ItemRow} from './ItemRow'
import {ArrayOfPrimitivesFunctions} from './ArrayOfPrimitivesFunctions'

export interface DefaultArrayOfPrimitivesInputProps extends ArrayOfPrimitivesInputProps {
  ArrayFunctionsImpl: React.ComponentType<
    FormArrayInputFunctionsProps<ArraySchemaType<PrimitiveValue[]>, PrimitiveValue>
  >
}

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

  handleSortEnd = (event: {oldIndex: number; newIndex: number}) => {
    const {onFocusIndex, onMoveItem, value} = this.props
    if (value) onMoveItem({fromIndex: event.oldIndex, toIndex: event.newIndex})
    onFocusIndex(event.newIndex)
  }

  setElement = (el: HTMLElement | null) => {
    this._element = el
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  handleFocusRoot = (event: React.FocusEvent<HTMLDivElement>) => {
    const {onFocus} = this.props
    // We want to handle focus when the array input *itself* element receives
    // focus, not when a child element receives focus, but React has decided
    // to let focus bubble, so this workaround is needed
    // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
    if (event.currentTarget === event.target && event.currentTarget === this._element) {
      onFocus(event)
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

  renderItem = (props: PrimitiveItemProps) => {
    const {schemaType, readOnly} = this.props
    const isSortable = !readOnly && get(schemaType, 'options.sortable') !== false

    return (
      <ItemRow
        {...props}
        isSortable={isSortable}
        insertableTypes={schemaType.of}
        onEnterKey={this.handleItemEnterKey}
        onEscapeKey={this.handleItemEscapeKey}
      />
    )
  }

  render() {
    const {schemaType, members, readOnly, value, onChange, renderInput} = this.props

    const isSortable = !readOnly && get(schemaType, 'options.sortable') !== false

    return (
      <Stack space={3}>
        <Stack space={1}>
          {members.length > 0 && (
            <Card padding={1} border>
              <List onSortEnd={this.handleSortEnd} isSortable={isSortable}>
                {members.map((member, index) => {
                  if (member.kind === 'item') {
                    return (
                      <Item
                        key={member.key}
                        index={index}
                        data-item-index={index}
                        isSortable={isSortable}
                      >
                        <PrimitiveMemberItem
                          member={member}
                          renderInput={renderInput}
                          renderItem={this.renderItem}
                        />
                      </Item>
                    )
                  }
                  if (member.kind === 'error') {
                    return <MemberItemError key={member.key} member={member} />
                  }
                  //@ts-expect-error all possible cases should be covered
                  return <>Unknown member kind: ${member.kind}</>
                })}
              </List>
            </Card>
          )}
        </Stack>

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
