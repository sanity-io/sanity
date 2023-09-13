import React from 'react'
import {get} from 'lodash'
import {Card, Stack, Text} from '@sanity/ui'
import {ArrayOfPrimitivesInputProps} from '../../../types'
import {Item, List} from '../common/list'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {ArrayOfPrimitivesItem} from '../../../members'
import {ErrorItem} from '../ArrayOfObjectsInput/List/ErrorItem'
import {UploadTargetCard} from '../common/UploadTargetCard'
import {ChangeIndicator} from '../../../../changeIndicators'
import {getEmptyValue} from './getEmptyValue'
import {PrimitiveValue} from './types'
import {nearestIndexOf} from './utils/nearestIndex'
import {ItemRow} from './ItemRow'
import {ArrayOfPrimitivesFunctions} from './ArrayOfPrimitivesFunctions'

interface State {
  disableTransition: boolean
}
// Note: this should be a class component until React provides support for a hook version of getSnapshotBeforeUpdate
/**
 * @hidden
 * @beta */
export class ArrayOfPrimitivesInput extends React.PureComponent<
  ArrayOfPrimitivesInputProps,
  State
> {
  _element: HTMLElement | null = null

  constructor(props: ArrayOfPrimitivesInputProps) {
    super(props)

    this.state = {
      disableTransition: false,
    }
  }

  handleAppend = (itemValue: PrimitiveValue) => {
    const {value = [], onIndexFocus, onItemAppend} = this.props
    onItemAppend(itemValue)
    onIndexFocus(value.length)
  }

  handlePrepend = (itemValue: PrimitiveValue) => {
    const {onIndexFocus, value = [], onItemPrepend} = this.props
    onItemPrepend(itemValue)
    onIndexFocus(value.length)
  }

  handleSortEnd = (event: {fromIndex: number; toIndex: number}) => {
    const {onIndexFocus, onMoveItem, value} = this.props

    if (value) onMoveItem(event)
    onIndexFocus(event.toIndex)
  }

  // Enable transition when the user starts dragging an item
  handleItemMoveStart = () => {
    this.setState({disableTransition: false})
  }

  // Disable transition when the user stops dragging an item.
  // Note: there's an issue with the transition of items when the sorting is completed, so we disable the
  // transition effect when the user stops dragging.
  handleItemMoveEnd = () => {
    this.setState({disableTransition: true})
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
    snapshot?: {restoreSelection: {start: number; end: number}; prevFocusedIndex: number},
  ) {
    const {onIndexFocus} = this.props
    if (snapshot?.restoreSelection && prevProps.value) {
      const prevFocusedValue = prevProps.value[snapshot.prevFocusedIndex]

      const nearestIndex = nearestIndexOf(
        this.props.value || [],
        snapshot.prevFocusedIndex,
        prevFocusedValue,
      )

      if (nearestIndex === -1) {
        return
      }
      const newInput = this._element?.querySelector(
        `[data-item-index='${nearestIndex}'] input,textarea`,
      )

      if (newInput instanceof HTMLInputElement) {
        newInput.focus()
        try {
          newInput.setSelectionRange(snapshot.restoreSelection.start, snapshot.restoreSelection.end)
        } catch {
          // not all inputs supports selection (e.g. <input type="number" />)
        }
      }
      onIndexFocus(nearestIndex)
    }
  }

  renderArrayItem = (props: Omit<PrimitiveItemProps, 'renderDefault'>) => {
    const {schemaType} = this.props
    const sortable = schemaType.options?.sortable !== false
    return <ItemRow {...props} sortable={sortable} insertableTypes={schemaType.of} />
  }

  render() {
    const {
      schemaType,
      members,
      readOnly,
      renderInput,
      onUpload,
      onItemRemove,
      resolveUploader,
      elementProps,
      arrayFunctions: ArrayFunctions = ArrayOfPrimitivesFunctions,
      changed,
    } = this.props

    const isSortable = !readOnly && get(schemaType, 'options.sortable') !== false

    // Note: we need this in order to generate new id's when items are moved around in the list
    // without it, dndkit will restore focus on the original index of the dragged item
    const membersWithSortIds = members.map((member) => ({
      id: `${member.key}-${member.kind === 'item' ? member.item.value : 'error'}`,
      member: member,
    }))

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
            {membersWithSortIds.length === 0 ? (
              <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
                <Text align="center" muted size={1}>
                  {schemaType.placeholder || <>No Items</>}
                </Text>
              </Card>
            ) : (
              <Card padding={1} border>
                <List
                  onItemMove={this.handleSortEnd}
                  onItemMoveStart={this.handleItemMoveStart}
                  onItemMoveEnd={this.handleItemMoveEnd}
                  items={membersWithSortIds.map((m) => m.id)}
                  sortable={isSortable}
                  gap={1}
                >
                  {membersWithSortIds.map(({member, id}, index) => {
                    return (
                      <Item
                        key={member.key}
                        id={id}
                        sortable={isSortable}
                        disableTransition={this.state.disableTransition}
                      >
                        {member.kind === 'item' && (
                          <ChangeIndicator
                            path={member.item.path}
                            isChanged={changed}
                            hasFocus={false}
                          >
                            <ArrayOfPrimitivesItem
                              member={member}
                              renderItem={this.renderArrayItem}
                              renderInput={renderInput}
                            />
                          </ChangeIndicator>
                        )}
                        {member.kind === 'error' && (
                          <ErrorItem
                            sortable={isSortable}
                            member={member}
                            onRemove={() => onItemRemove(index)}
                          />
                        )}
                      </Item>
                    )
                  })}
                </List>
              </Card>
            )}
          </Stack>
        </UploadTargetCard>

        <ArrayFunctions
          onChange={this.props.onChange}
          onItemAppend={this.handleAppend}
          onItemPrepend={this.handlePrepend}
          onValueCreate={getEmptyValue}
          readOnly={this.props.readOnly}
          schemaType={this.props.schemaType}
          value={this.props.value}
        />
      </Stack>
    )
  }
}
