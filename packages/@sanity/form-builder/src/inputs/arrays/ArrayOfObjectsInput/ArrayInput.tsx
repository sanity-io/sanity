import {FormFieldPresence} from '@sanity/base/presence'
import {
  ArraySchemaType,
  isKeySegment,
  isObjectSchemaType,
  Marker,
  ObjectSchemaType,
  Path,
  SchemaType,
} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {isPlainObject} from 'lodash'
import {FormFieldSet, ImperativeToast} from '@sanity/base/components'
import {Box, Button, Card, Flex, Spinner, Stack, Text, ToastParams} from '@sanity/ui'
import React from 'react'
import {map} from 'rxjs/operators'
import {Subscription} from 'rxjs'
import {randomKey, resolveTypeName} from '@sanity/util/content'
import {insert, PatchEvent, set, setIfMissing, unset} from '../../../PatchEvent'
import {FileLike, Uploader, UploadEvent} from '../../../sanity/uploads/types'
import {Alert} from '../../../components/Alert'
import {Details} from '../../../components/Details'
import {Item, List} from '../common/list'
import {EMPTY_ARRAY} from '../../../utils/empty'
import ArrayFunctions from '../common/ArrayFunctions'
import {applyAll} from '../../../patch/applyPatch'
import {ArrayItem} from './item'
import type {ArrayMember, ReferenceItemComponentType} from './types'
import {uploadTarget} from './uploadTarget/uploadTarget'

declare const __DEV__: boolean

type Toast = {push: (params: ToastParams) => void}

let UploadTargetFieldsetMemo: any
function getUploadTargetFieldset() {
  if (!UploadTargetFieldsetMemo) {
    UploadTargetFieldsetMemo = uploadTarget(FormFieldSet)
  }
  return UploadTargetFieldsetMemo
}

function createProtoValue(type: SchemaType): ArrayMember {
  if (!isObjectSchemaType(type)) {
    throw new Error(
      `Invalid item type: "${type.type}". Default array input can only contain objects (for now)`
    )
  }

  const _key = randomKey(12)
  return type.name === 'object' ? {_key} : {_type: type.name, _key}
}

export interface Props {
  type: ArraySchemaType
  value: ArrayMember[]
  compareValue: ArrayMember[]
  markers: Marker[]
  level: number
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  readOnly: boolean
  ReferenceItemComponent: ReferenceItemComponentType
  filterField: () => any
  ArrayFunctionsImpl: typeof ArrayFunctions
  resolveUploader?: (type: SchemaType, file: FileLike) => Uploader | null
  resolveInitialValue?: (type: ObjectSchemaType, value: any) => Promise<any>
  presence: FormFieldPresence[]
}

interface State {
  isResolvingInitialValue: boolean
}

export class ArrayInput extends React.Component<Props> {
  static defaultProps = {
    focusPath: [],
  }

  _focusArea: HTMLElement | null = null
  toast: Toast | null = null

  uploadSubscriptions: Record<string, Subscription> = {}
  state: State = {
    isResolvingInitialValue: false,
  }

  insert = (itemValue: ArrayMember, position: 'before' | 'after', atIndex: number) => {
    const {onChange} = this.props

    onChange(PatchEvent.from(setIfMissing([]), insert([itemValue], position, [atIndex])))
  }

  handlePrepend = (value: ArrayMember) => {
    this.insert(value, 'before', 0)
    this.handleFocusItem(value)
  }

  handleAppend = (value: ArrayMember) => {
    const {resolveInitialValue} = this.props
    this.setState({isResolvingInitialValue: true})
    const memberType = this.getMemberTypeOfItem(value)
    const resolvedInitialValue = resolveInitialValue
      ? resolveInitialValue(memberType as ObjectSchemaType, value)
      : Promise.resolve({})
    resolvedInitialValue
      .then(
        (initial) => {
          this.insert({...value, ...initial}, 'after', -1)
          this.handleFocusItem(value)
        },
        (error) => {
          this.toast?.push({
            title: `Could not resolve initial value`,
            description: `Unable to resolve initial value for type: ${memberType.name}: ${error.message}.`,
            status: 'error',
          })
          this.insert(value, 'after', -1)
          this.handleFocusItem(value)
        }
      )
      .finally(() => {
        this.setState({isResolvingInitialValue: false})
      })
  }

  handleRemoveItem = (item: ArrayMember) => {
    this.removeItem(item)
  }

  handleFocus = (event) => {
    // We want to handle focus when the array input *itself* element receives
    // focus, not when a child element receives focus, but React has decided
    // to let focus bubble, so this workaround is needed
    // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
    if (event.currentTarget === event.target && event.currentTarget === this._focusArea) {
      this.props.onFocus([])
    }
  }

  handleFocusItem = (item: ArrayMember) => {
    this.props.onFocus([{_key: item._key}, FOCUS_TERMINATOR])
    // this.props.onFocus([{_key: item._key}, item._type === 'reference' ? '_ref' : FOCUS_TERMINATOR])
  }

  removeItem(item: ArrayMember) {
    const {onChange, onFocus, value} = this.props

    // create a patch for removing the item
    const patch = PatchEvent.from(
      unset(isKeySegment(item) ? [{_key: item._key}] : [value.indexOf(item)])
    )
    // apply the patch to the current value
    const result = applyAll(value || [], patch.patches)

    // if the result is an empty array
    if (Array.isArray(result) && !result.length) {
      // then unset the value
      onChange(PatchEvent.from(unset()))
    } else {
      // otherwise apply the patch
      onChange(patch)
    }

    if (item._key in this.uploadSubscriptions) {
      this.uploadSubscriptions[item._key].unsubscribe()
    }

    const idx = value.indexOf(item)
    const nextItem = value[idx + 1] || value[idx - 1]

    onFocus([nextItem ? {_key: nextItem._key} : FOCUS_TERMINATOR])
  }

  handleItemChange = (event: PatchEvent, item: ArrayMember) => {
    const {onChange, value} = this.props
    const memberType = this.getMemberTypeOfItem(item)

    if (!memberType) {
      // eslint-disable-next-line no-console
      console.log('Could not find member type of item ', item)
      return
    }

    if (memberType.readOnly) {
      return
    }

    const key = item._key || randomKey(12)

    onChange(
      event.prefixAll({_key: key}).prepend(item._key ? [] : set(key, [value.indexOf(item), '_key']))
    )
  }

  handleSortEnd = (event: {newIndex: number; oldIndex: number}) => {
    const {value, onChange} = this.props
    const item = value[event.oldIndex]
    const refItem = value[event.newIndex]

    if (!item._key || !refItem._key) {
      // eslint-disable-next-line no-console
      console.error(
        'Neither the item you are moving nor the item you are moving to have a key. Cannot continue.'
      )
      return
    }

    if (event.oldIndex === event.newIndex || item._key === refItem._key) {
      return
    }

    onChange(
      PatchEvent.from(
        unset([{_key: item._key}]),
        insert([item], event.oldIndex > event.newIndex ? 'before' : 'after', [{_key: refItem._key}])
      )
    )
  }

  getMemberTypeOfItem(item: ArrayMember): SchemaType {
    const {type} = this.props
    const itemTypeName = resolveTypeName(item)

    return type.of.find((memberType) => memberType.name === itemTypeName) as SchemaType
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  setFocusArea = (el: HTMLElement | null) => {
    this._focusArea = el
  }

  handleFixMissingKeys = () => {
    const {onChange, value} = this.props
    const patches = value.map((val, i) => setIfMissing(randomKey(), [i, '_key']))

    onChange(PatchEvent.from(...patches))
  }
  setToast = (toast: any | null) => {
    this.toast = toast
  }
  handleRemoveNonObjectValues = () => {
    const {onChange, value} = this.props
    const nonObjects = value
      .reduce((acc: number[], val, i) => (isPlainObject(val) ? acc : acc.concat(i)), [])
      .reverse()
    const patches = nonObjects.map((index) => unset([index]))

    onChange(PatchEvent.from(...patches))
  }

  handleUpload = ({file, type, uploader}: {file: File; type: SchemaType; uploader: Uploader}) => {
    const {onChange} = this.props
    const item = createProtoValue(type)
    const key = item._key

    this.insert(item, 'after', -1)

    const events$ = uploader
      .upload(file, type)
      .pipe(
        map((uploadEvent: UploadEvent) =>
          PatchEvent.from(uploadEvent.patches || []).prefixAll({_key: key})
        )
      )

    this.uploadSubscriptions = {
      ...this.uploadSubscriptions,
      [key]: events$.subscribe(onChange),
    }
  }

  render() {
    const {
      type,
      level = 1,
      markers,
      readOnly,
      onChange,
      value = [],
      presence,
      focusPath,
      onBlur,
      resolveUploader,
      onFocus,
      compareValue,
      filterField,
      ReferenceItemComponent,
      ArrayFunctionsImpl,
    } = this.props

    const {isResolvingInitialValue} = this.state

    const hasNonObjectValues = (value || []).some((item) => !isPlainObject(item))

    if (hasNonObjectValues) {
      return (
        <FormFieldSet
          title={type.title}
          description={type.description}
          level={level - 1}
          tabIndex={0}
          onFocus={this.handleFocus}
          ref={this.setFocusArea}
          __unstable_markers={markers}
        >
          <Alert
            status="error"
            suffix={
              <Stack padding={2}>
                <Button
                  onClick={this.handleRemoveNonObjectValues}
                  text="Remove non-object values"
                  tone="critical"
                />
              </Stack>
            }
            title={<>Invalid list values</>}
          >
            <Text as="p" muted size={1}>
              Some items in this list are not objects. This must be fixed in order to edit the list.
            </Text>

            <Details marginTop={4} open={__DEV__} title={<>Developer info</>}>
              <Stack space={3}>
                <Text as="p" muted size={1}>
                  This usually happens when items are created using an API client, or when a custom
                  input component has added invalid data to the list.
                </Text>
              </Stack>
            </Details>
          </Alert>
        </FormFieldSet>
      )
    }

    const options = type.options || {}
    const hasMissingKeys = value.some((item) => !item._key)
    const isSortable = options.sortable !== false && !hasMissingKeys
    const isGrid = options.layout === 'grid'
    const fieldPresence = presence.filter((item) => item.path.length === 0)
    const UploadTargetFieldset = getUploadTargetFieldset()
    return (
      <UploadTargetFieldset
        __unstable_changeIndicator={false}
        tabIndex={0}
        title={type.title}
        description={type.description}
        onFocus={this.handleFocus}
        onBlur={onBlur}
        level={level - 1}
        __unstable_presence={fieldPresence.length > 0 ? fieldPresence : EMPTY_ARRAY}
        __unstable_markers={markers}
        disabled={readOnly}
        ref={this.setFocusArea}
        resolveUploader={resolveUploader}
        types={type.of}
        onUpload={this.handleUpload}
      >
        <ImperativeToast ref={this.setToast} />
        <Stack space={3}>
          {hasMissingKeys && (
            <Alert
              status="warning"
              suffix={
                <Stack padding={2}>
                  <Button
                    onClick={this.handleFixMissingKeys}
                    text="Add missing keys"
                    tone="caution"
                  />
                </Stack>
              }
              title={<>Missing keys</>}
            >
              <Text as="p" muted size={1}>
                Some items in the list are missing their keys. This must be fixed in order to edit
                the list.
              </Text>

              <Details marginTop={4} open={__DEV__} title={<>Developer info</>}>
                <Stack space={3}>
                  <Text as="p" muted size={1}>
                    This usually happens when items are created using an API client, and the{' '}
                    <code>_key</code> property has not been included.
                  </Text>

                  <Text as="p" muted size={1}>
                    The value of the <code>_key</code> property must be a unique string.
                  </Text>
                </Stack>
              </Details>
            </Alert>
          )}

          <Stack data-ui="ArrayInput__content" space={3}>
            {(value?.length > 0 || isResolvingInitialValue) && (
              <Card border={!isGrid} radius={1} paddingY={1}>
                <List onSortEnd={this.handleSortEnd} isSortable={isSortable} isGrid={isGrid}>
                  {value.map((item, index) => {
                    return (
                      <Item
                        key={item._key || index}
                        isSortable={isSortable}
                        isGrid={isGrid}
                        index={index}
                      >
                        <ArrayItem
                          compareValue={compareValue}
                          filterField={filterField}
                          focusPath={focusPath}
                          itemKey={item._key}
                          index={index}
                          markers={markers}
                          ReferenceItemComponent={ReferenceItemComponent}
                          onBlur={onBlur}
                          onChange={this.handleItemChange}
                          onFocus={onFocus}
                          onRemove={this.handleRemoveItem}
                          presence={presence}
                          readOnly={readOnly || hasMissingKeys}
                          type={type}
                          value={item}
                        />
                      </Item>
                    )
                  })}
                  {isResolvingInitialValue && (
                    <Item isGrid={isGrid} index={-1}>
                      <Card radius={1} padding={1}>
                        <Flex align="center" justify="center" padding={3}>
                          <Box marginX={3}>
                            <Spinner muted />
                          </Box>
                          <Text>Resolving initial value…</Text>
                        </Flex>
                      </Card>
                    </Item>
                  )}
                </List>
              </Card>
            )}

            <ArrayFunctionsImpl
              type={type}
              value={value}
              readOnly={readOnly}
              onAppendItem={this.handleAppend}
              onPrependItem={this.handlePrepend}
              onFocusItem={this.handleFocusItem}
              onCreateValue={createProtoValue}
              onChange={onChange}
            />
          </Stack>
        </Stack>
      </UploadTargetFieldset>
    )
  }
}
