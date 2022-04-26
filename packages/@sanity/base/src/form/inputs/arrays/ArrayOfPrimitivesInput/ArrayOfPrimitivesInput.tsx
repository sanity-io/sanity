import React from 'react'
import {get} from 'lodash'
import {startsWith} from '@sanity/util/paths'
import {ArraySchemaType, SchemaType} from '@sanity/types'
import {Card, Stack} from '@sanity/ui'
import {resolveTypeName} from '@sanity/util/content'
import {FormFieldSet} from '../../../../components/formField'
import {ArrayInputProps, FormArrayInputFunctionsProps} from '../../../types'
import {PatchEvent, set, unset} from '../../../patch'
import {Item, List} from '../common/list'
import {getEmptyValue} from './getEmptyValue'
// import {ItemRow} from './ItemRow'
import {PrimitiveValue} from './types'
import {nearestIndexOf} from './utils/nearestIndex'

function move<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

/**
 * @example
 * Inserts "hello" at the beginning
 * ```ts
 * insertAfter(-1, ["one", "two"], "hello")
 * // => ["hello", "one", "two"]
 * ```
 */
function insertAfter<T>(
  /**
   * index to insert item after. An index of -1 will prepend the item
   */
  index: number,
  /**
   * the array to insert the item into
   */
  arr: T[],
  /**
   * the item to insert
   */
  item: T
): T[] {
  const copy = arr.slice()
  copy.splice(index + 1, 0, item)
  return copy
}

export interface ArrayOfPrimitivesInputProps extends ArrayInputProps<PrimitiveValue[]> {
  ArrayFunctionsImpl: React.ComponentType<
    FormArrayInputFunctionsProps<ArraySchemaType<PrimitiveValue[]>, PrimitiveValue>
  >
}

export class ArrayOfPrimitivesInput extends React.PureComponent<ArrayOfPrimitivesInputProps> {
  _element: HTMLElement | null = null
  _lastAddedIndex = -1

  set(nextValue: PrimitiveValue[]) {
    const {onChange} = this.props
    this._lastAddedIndex = -1
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    onChange(patch)
  }

  removeAt(index: number) {
    const {inputProps} = this.props
    const {value = []} = this.props
    this.set(value.filter((_, i) => i !== index))
    inputProps.onFocus([Math.max(0, index - 1)])
  }

  handleAppend = (itemValue: PrimitiveValue) => {
    const {value = [], inputProps} = this.props
    this.set(value.concat(itemValue))
    inputProps.onFocus([value.length])
  }

  handlePrepend = (itemValue: PrimitiveValue) => {
    const {value = [], inputProps} = this.props
    this.set([itemValue].concat(value))
    inputProps.onFocus([value.length])
  }

  insertAfter(index: number, type: SchemaType) {
    const {value = [], inputProps} = this.props
    const emptyValue = getEmptyValue(type)
    if (emptyValue === undefined) {
      throw new Error(`Cannot create empty primitive value from ${type.name}`)
    }
    this.set(insertAfter(index, value, emptyValue))
    inputProps.onFocus([index + 1])
  }

  handleRemoveItem = (index: number) => {
    this.removeAt(index)
  }

  handleInsert = (pos: 'before' | 'after', index: number, item: PrimitiveValue) => {
    const {value = [], inputProps} = this.props
    const insertIndex = index + (pos === 'before' ? -1 : 0)
    this.set(insertAfter(insertIndex, value, item))
    inputProps.onFocus([insertIndex + 1])
  }

  handleItemChange = (event: PatchEvent) => {
    this._lastAddedIndex = -1
    this.props.onChange(event.patches)
  }

  handleItemEnterKey = (index: number) => {
    const firstType = this.props.type?.of[0]
    if (firstType) {
      this.insertAfter(index, firstType)
      this._lastAddedIndex = index + 1
    }
  }

  handleItemEscapeKey = (index: number) => {
    const {value} = this.props
    if (index === this._lastAddedIndex && value?.[index] === '') {
      this.removeAt(index)
    }
  }

  handleSortEnd = (event: {oldIndex: number; newIndex: number}) => {
    const {value, inputProps} = this.props
    const {oldIndex, newIndex} = event
    if (value) this.set(move(value, oldIndex, newIndex))
    inputProps.onFocus([newIndex])
  }

  getMemberType(typeName: string) {
    const {type} = this.props
    return type?.of.find(
      (memberType) => memberType.name === typeName || memberType.jsonType === typeName
    )
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
    const {inputProps} = this.props
    // We want to handle focus when the array input *itself* element receives
    // focus, not when a child element receives focus, but React has decided
    // to let focus bubble, so this workaround is needed
    // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
    if (event.currentTarget === event.target && event.currentTarget === this._element) {
      inputProps.onFocus([])
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
    const {inputProps} = this.props
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
      inputProps.onFocus([nearestIndex])
    }
  }

  handleFocusItem = (item: PrimitiveValue, index: number) => {
    const {inputProps} = this.props
    inputProps.onFocus([index])
  }

  render() {
    const {
      inputProps,
      type,
      value,
      level = 1,
      validation,
      onChange,
      presence,
      compareValue,
      focusPath,
      ArrayFunctionsImpl,
    } = this.props

    const {onBlur, onFocus, readOnly} = inputProps

    const isSortable = !readOnly && get(type, 'options.sortable') !== false

    return (
      <FormFieldSet
        title={type?.title}
        description={type?.description}
        level={level - 1}
        tabIndex={0}
        onFocus={this.handleFocusRoot}
        ref={this.setElement}
        __unstable_presence={presence.filter(
          (item) => item.path[0] === '$' || item.path.length === 0
        )}
        __unstable_changeIndicator={false}
        validation={validation}
        onSetCollapsed={() => console.warn('todo')}
      >
        <Stack space={3}>
          <Stack space={1}>
            {value && value.length > 0 && (
              <Card padding={1} border>
                <List onSortEnd={this.handleSortEnd} isSortable={isSortable}>
                  {value.map((item, index) => {
                    const itemValidationMarkers = validation.filter((marker) =>
                      startsWith([index], marker.path)
                    )

                    const childPresence = presence.filter((pItem) =>
                      startsWith([index], pItem.path)
                    )

                    const memberType = this.getMemberType(resolveTypeName(item))

                    // Best effort attempt to make a stable key for each item in the array
                    // Since items may be reordered and change at any time, there's no way to reliably address each item uniquely
                    // This is a "best effort"-attempt at making sure we don't re-use internal state for item inputs
                    // when items gets added or removed to the array
                    const key = `${memberType?.name || 'invalid-type'}-${String(index)}`
                    return (
                      <Item key={key} index={index} data-item-index={index} isSortable={isSortable}>
                        <>
                          TODO
                          {/* <ItemRow
                            level={level + 1}
                            index={index}
                            value={item}
                            compareValue={compareValue?.[index]}
                            readOnly={readOnly}
                            validation={
                              itemValidationMarkers.length === 0
                                ? NO_MARKERS
                                : itemValidationMarkers
                            }
                            isSortable={isSortable}
                            type={memberType!} // @todo: remove non-null assertion
                            focusPath={focusPath}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            insertableTypes={type.of}
                            onEnterKey={this.handleItemEnterKey}
                            onEscapeKey={this.handleItemEscapeKey}
                            onChange={this.handleItemChange}
                            onInsert={this.handleInsert}
                            onRemove={this.handleRemoveItem}
                            presence={childPresence}
                          /> */}
                        </>
                      </Item>
                    )
                  })}
                </List>
              </Card>
            )}
          </Stack>
          <ArrayFunctionsImpl
            type={type}
            value={value}
            readOnly={readOnly}
            onAppendItem={this.handleAppend}
            onPrependItem={this.handlePrepend}
            onFocusItem={this.handleFocusItem}
            onCreateValue={getEmptyValue}
            onChange={onChange}
          />
        </Stack>
      </FormFieldSet>
    )
  }
}
