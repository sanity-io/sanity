// @flow
import type {ArrayType, ItemValue} from './typedefs'
import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import {sortBy, reverse} from 'lodash'
import Button from 'part:@sanity/components/buttons/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import RenderItemValue from './ItemValue'
import styles from './styles/Array.css'
import humanize from 'humanize-list'
import randomKey from './randomKey'
import PatchEvent, {insert, setIfMissing, unset, set} from '../../PatchEvent'
import resolveListComponents from './resolveListComponents'
import {resolveTypeName} from '../../utils/resolveTypeName'
import type {Uploader} from '../../sanity/uploads/typedefs'

function hasKeys(object, exclude = []) {
  for (const key in object) {
    if (!exclude.includes(key)) {
      return true
    }
  }
  return false
}

function isEmpty(value: ?ItemValue) {
  return value === undefined || !hasKeys(value, ['_key', '_type', 'index'])
}

function createProtoValue(type: Type): ItemValue {
  if (type.jsonType !== 'object') {
    throw new Error(`Invalid item type: "${type.type}". Default array input can only contain objects (for now)`)
  }
  const key = randomKey(12)
  return type.name === 'object' ? {_key: key} : {
    _type: type.name,
    _key: key
  }
}

type UploadOption = {
  type: Type,
  uploader: Uploader
}

type Task = {
  file: File,
  importOptions: Array<UploadOption>
}

type Props = {
  type: ArrayType,
  value: Array<ItemValue>,
  level: number,
  onChange: (event: PatchEvent) => void,
  resolveUploader: (type: Type, file: File) => Uploader
}

type State = {
  editItemKey: ?string,
  unimportable: Array<Task>,
  needsSelect: Array<Task>,
}

export default class ArrayInput extends React.Component<Props, State> {
  state = {
    editItemKey: null,
    unimportable: [],
    needsSelect: []
  }

  importSubscriptions: {}
  importSubscriptions = {}

  insert(itemValue: ItemValue, position: 'before' | 'after', atIndex: number) {
    const {onChange} = this.props
    onChange(PatchEvent.from(
      setIfMissing([]),
      insert([itemValue], position, [atIndex])
    ))
  }

  prepend(value: ItemValue) {
    this.insert(value, 'before', 0)
  }

  append(value: ItemValue) {
    this.insert(value, 'after', -1)
  }

  handleRemoveItem = (item: ItemValue) => {
    this.removeItem(item)
  }

  handleItemEditStop = (item: ItemValue) => {
    const itemValue = this.getEditItem()
    if (itemValue && isEmpty(itemValue)) {
      this.removeItem(itemValue)
    }
    this.setState({editItemKey: null})
  }

  handleItemEditStart = (item: ItemValue) => {
    this.setState({editItemKey: item._key})
  }

  handleDropDownAction = (menuItem: { type: Type }) => {
    const item = createProtoValue(menuItem.type)
    this.append(item)
    this.setState({editItemKey: item._key})
  }

  handleAddBtnClick = () => {
    const {type} = this.props
    const memberType = type.of[0]
    if (!memberType) {
      throw new Error('Nothing to add')
    }
    const item = createProtoValue(memberType)
    this.append(item)
    this.setState({editItemKey: item._key})
  }

  removeItem(item: ItemValue) {
    const {onChange, value} = this.props
    if (item._key === this.state.editItemKey) {
      this.setState({editItemKey: null})
    }
    onChange(
      PatchEvent.from(
        unset(item._key ? [{_key: item._key}] : [value.indexOf(item)])
      )
    )
    if (item._key in this.importSubscriptions) {
      this.importSubscriptions[item._key].unsubscribe()
    }
  }

  renderSelectType() {
    const {type} = this.props

    const items = type.of.map((memberDef, i) => {
      return {
        title: memberDef.title || memberDef.type.name,
        type: memberDef
      }
    })

    return (
      <DropDownButton items={items} color="primary" onAction={this.handleDropDownAction}>
        New {this.props.type.title}
      </DropDownButton>
    )
  }

  handlePaste = (ev: SyntheticClipboardEvent<*>) => {
    if (ev.clipboardData.files) {
      ev.preventDefault()
      ev.stopPropagation()
      this.importFiles(Array.from(ev.clipboardData.files))
    }
  }

  handleDragOver = (ev: SyntheticDragEvent<*>) => {
    ev.preventDefault()
    ev.stopPropagation()
  }

  getUploadOptions = (file: File): Array<UploadOption> => {
    const {type, resolveUploader} = this.props
    return type.of
      .map(memberType => {
        const uploader = resolveUploader(memberType, file)
        return uploader && {
          type: memberType,
          uploader
        }
      })
      .filter(Boolean)
  }

  importFiles(files: Array<File>) {
    const tasks = files.map(file => ({
      file,
      importOptions: this.getUploadOptions(file)
    }))

    const ready = tasks
      .filter(task => task.importOptions.length > 0)

    const unimportable = tasks
      .filter(task => task.importOptions.length === 0)
    this.setState({unimportable})

    // todo: consider if we need to ask the user
    // const needsSelect = tasks
    //   .filter(task => task.importOptions.length > 1)

    ready
      .forEach(task => {
        this.importFile(task.file, reverse(sortBy(task.importOptions, 'priority'))[0])
      })
  }

  importFile(file: File, importOption: UploadOption) {
    const {onChange} = this.props

    const {type, uploader} = importOption
    const item = createProtoValue(type)

    const key = item._key
    this.append(item)

    const events$ = uploader.upload(file, type)
      .map(importEvent => PatchEvent.from(importEvent.patches).prefixAll({_key: key}))

    this.importSubscriptions = {
      ...this.importSubscriptions,
      [key]: events$.subscribe(onChange)
    }
  }

  handleDrop = (ev: SyntheticDragEvent<*>) => {
    if (ev.dataTransfer.files) {
      // todo: support folders with webkitGetAsEntry
      ev.preventDefault()
      ev.stopPropagation()
      this.importFiles(Array.from(ev.dataTransfer.files))
    }
  }

  handleItemChange = (event: PatchEvent, item: ItemValue) => {
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
      event
        .prefixAll({_key: key})
        .prepend(item._key ? [] : set(key, [value.indexOf(item), '_key']))
    )
  }

  handleSort = (event: { newIndex: number, oldIndex: number }) => {
    const {value, onChange} = this.props
    const item = value[event.oldIndex]
    const refItem = value[event.newIndex]

    // console.log('from %d => %d', event.oldIndex, event.newIndex, event)
    if (!item._key || !refItem._key) {
      // eslint-disable-next-line no-console
      console.error('Neither the item you are moving nor the item you are moving to have a key. Cannot continue.')
      return
    }

    if (event.oldIndex === event.newIndex || item._key === refItem._key) {
      return
    }

    onChange(PatchEvent.from(
      unset([{_key: item._key}]),
      insert(
        [item],
        event.oldIndex > event.newIndex ? 'before' : 'after',
        [{_key: refItem._key}]
      )
    ))
  }

  getEditItem(): ? ItemValue {
    const {editItemKey} = this.state
    const {value} = this.props
    return typeof editItemKey === 'number'
      ? value[editItemKey]
      : value.find(item => item._key === editItemKey)
  }

  getMemberTypeOfItem(item: ItemValue): ? Type {
    const {type} = this.props
    const itemTypeName = resolveTypeName(item)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  renderList() {
    const {type, value} = this.props
    const options = type.options || {}

    const isSortable = options.sortable !== false
    const isGrid = options.layout === 'grid'

    const {List, Item} = resolveListComponents(isSortable, isGrid)

    const listProps = isSortable
      ? {movingItemClass: styles.movingItem, onSort: this.handleSort}
      : {}

    return (
      <List
        {...listProps}
      >
        {value.map((item, index) => {
          const {editItemKey} = this.state
          const itemProps = isSortable ? {index} : {}
          return (
            <Item key={item._key} className={styles.item} {...itemProps}>
              <RenderItemValue
                type={type}
                value={item}
                onRemove={this.handleRemoveItem}
                onChange={this.handleItemChange}
                onEditStart={this.handleItemEditStart}
                onEditStop={this.handleItemEditStop}
                isEditing={editItemKey === item._key}
              />
            </Item>
          )
        })}
      </List>
    )
  }

  render() {
    const {type, level, value} = this.props
    const {unimportable, needsSelect} = this.state

    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex="0"
        onPaste={this.handlePaste} /* note: the onPaste must be on fieldset for it to work in chrome */
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
      >
        <div className={styles.root}>
          {
            value && value.length > 0 && (
              <div className={styles.list}>
                {this.renderList()}
              </div>
            )
          }
          {!type.readOnly && (
            <div className={styles.functions}>
              {this.props.type.of.length === 1 && (
                <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
                  Add
                </Button>
              )}
              {this.props.type.of.length > 1 && this.renderSelectType()}
            </div>
          )}
        </div>
        {needsSelect.length > 0 && (
          <Dialog
            isOpen
            title="Select how to represent"
            actions={[{title: 'Cancel'}]}
            onAction={() => this.setState({needsSelect: []})}
          >
            {needsSelect.map(task => (
              <div key={task.file.name}>
                The file {task.file.name} can be converted to several types of content.
                Please select how you want to represent it:
                <ul>
                  {task.importOptions.map(importOption => (
                    <li key={importOption.type.name}>
                      <Button
                        onClick={() => {
                          this.importFile(task.file, importOption)
                          this.setState({needsSelect: needsSelect.filter(t => t !== task)})
                        }}
                      >
                        Represent as {importOption.type.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Dialog>
        )}
        {unimportable.length > 0 && (
          <Snackbar
            kind="warning"
            action={{title: 'OK'}}
            onAction={() => this.setState({unimportable: []})}
          >
            File(s) not accepted:
            {humanize(unimportable.map(task => task.file.name))}
          </Snackbar>
        )}
      </Fieldset>
    )
  }
}
