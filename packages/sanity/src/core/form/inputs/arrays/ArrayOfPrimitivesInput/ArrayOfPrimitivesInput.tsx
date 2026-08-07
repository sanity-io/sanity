import {Card, type CardTone, Stack} from '@sanity/ui'
import get from 'lodash-es/get.js'
import {PureComponent} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {ArrayOfPrimitivesItem} from '../../../members/array/items/ArrayOfPrimitivesItem'
import {type ArrayOfPrimitivesMember} from '../../../store/types/members'
import {type ArrayOfPrimitivesInputProps} from '../../../types/inputProps'
import {type PrimitiveItemProps} from '../../../types/itemProps'
import {ErrorItem} from '../ArrayOfObjectsInput/List/ErrorItem'
import {ArrayItemsToggle} from '../common/ArrayItemsToggle'
import {ArrayValidationProvider} from '../common/ArrayValidationContext'
import {CollapsibleArrayItems} from '../common/CollapsibleArrayItems'
import {Item, List} from '../common/list'
import {getFocusedItemIndex} from '../common/useCollapsibleArrayItems'
import {ArrayOfPrimitivesFunctions} from './ArrayOfPrimitivesFunctions'
import {UploadTargetCard} from './arrayOfPrimitiveUploadTarget'
import {getEmptyValue} from './getEmptyValue'
import {ItemRow} from './ItemRow'
import {NoItemsPlaceholder} from './NoItemsPlaceholder'
import {type PrimitiveValue} from './types'
import {nearestIndexOf} from './utils/nearestIndex'

interface State {
  disableTransition: boolean
}

/**
 * dndkit restores focus by item id, so the id has to change when an item's value moves to a
 * different position. Keying on position alone would restore focus to the original index.
 */
function getSortId(member: ArrayOfPrimitivesMember): string {
  return `${member.key}-${member.kind === 'item' ? member.item.value : 'error'}`
}

/**
 * Note: this should be a class component until React provides support for a hook version of getSnapshotBeforeUpdate
 *
 * @hidden
 * @beta
 */
// oxlint-disable-next-line react/prefer-function-component -- needs getSnapshotBeforeUpdate (no hook equivalent)
export class ArrayOfPrimitivesInput extends PureComponent<ArrayOfPrimitivesInputProps, State> {
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
      focusPath,
      readOnly,
      renderInput,
      onUpload,
      onItemRemove,
      resolveUploader,
      elementProps,
      arrayFunctions: ArrayFunctions = ArrayOfPrimitivesFunctions,
      changed,
      validation,
    } = this.props

    const isSortable = !readOnly && get(schemaType, 'options.sortable') !== false
    const isGrid = schemaType.options?.layout === 'grid'

    // Compute tone for array container based on validation errors
    const hasErrors = validation?.some((v) => v.level === 'error')
    const errorTone: CardTone | undefined = hasErrors ? 'critical' : undefined

    return (
      <ArrayValidationProvider schemaType={schemaType} itemCount={members.length}>
        <Stack gap={2} data-testid="array-primitives-input">
          <UploadTargetCard
            types={schemaType.of}
            resolveUploader={resolveUploader}
            onUpload={onUpload}
            {...elementProps}
            tabIndex={0}
          >
            <Stack gap={1}>
              {members.length === 0 ? (
                <NoItemsPlaceholder schemaType={schemaType} validation={validation} />
              ) : (
                <CollapsibleArrayItems
                  members={members}
                  schemaType={schemaType}
                  layout={isGrid ? 'grid' : 'list'}
                  focusedIndex={getFocusedItemIndex(focusPath)}
                >
                  {({collapsible, expanded, onToggle, visibleMembers}) => (
                    <>
                      <Card padding={1} border tone={errorTone}>
                        <List
                          onItemMove={this.handleSortEnd}
                          onItemMoveStart={this.handleItemMoveStart}
                          onItemMoveEnd={this.handleItemMoveEnd}
                          items={visibleMembers.map(getSortId)}
                          sortable={isSortable}
                          gap={isGrid ? 3 : 1}
                          gridTemplateColumns={isGrid ? [2, 3, 4] : 1}
                          padding={isGrid ? 1 : undefined}
                          margin={isGrid ? 1 : undefined}
                        >
                          {visibleMembers.map((member) => (
                            <Item
                              key={member.key}
                              id={getSortId(member)}
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
                                  readOnly={readOnly}
                                  sortable={isSortable}
                                  member={member}
                                  onRemove={() => onItemRemove(member.index)}
                                />
                              )}
                            </Item>
                          ))}
                        </List>
                      </Card>
                      {collapsible && (
                        <ArrayItemsToggle
                          expanded={expanded}
                          onToggle={onToggle}
                          totalCount={members.length}
                        />
                      )}
                    </>
                  )}
                </CollapsibleArrayItems>
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
            path={this.props.path}
          />
        </Stack>
      </ArrayValidationProvider>
    )
  }
}
