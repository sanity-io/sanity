import React, {PropTypes} from 'react'
import {Editor} from 'slate'
import {isEqual, pick} from 'lodash'
import InsertBlockOnEnter from 'slate-insert-block-on-enter'

import DefaultButton from 'part:@sanity/components/buttons/default'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import BlockFormatSelect from './BlockFormatSelect'

import prepareSlateSchema from './util/prepareSlateSchema'
import styles from './styles/BlockEditor.css'

import SlateValueContainer from './SlateValueContainer'

import FormBuilderNodeOnDrop from './plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from './plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from './plugins/TextFormattingOnKeyDown'
import ListItemOnEnterKey from './plugins/ListItemOnEnterKey'
import TextBlockOnEnterKey from './plugins/TextBlockOnEnterKey'

import {
  SLATE_DEFAULT_NODE,
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
  SLATE_TEXT_BLOCKS,
  SLATE_LIST_BLOCKS,
  SLATE_LIST_ITEM_TYPE
} from './constants'


export default class BlockEditor extends React.Component {
  static valueContainer = SlateValueContainer

  static propTypes = {
    type: PropTypes.any,
    field: PropTypes.any,
    value: PropTypes.instanceOf(SlateValueContainer),
    validation: PropTypes.shape({
      errors: PropTypes.array
    }),
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)

    const slateSchema = prepareSlateSchema(this.props.field)
    this.slateSchema = slateSchema.schema
    this.groupedFields = slateSchema.fields
    this.slatePlugins = [
      InsertBlockOnEnter({kind: 'block', type: 'paragraph', nodes: [{kind: 'text', text: '', ranges: []}]}),
      FormBuilderNodeOnDrop(),
      FormBuilderNodeOnPaste(this.context.formBuilder, this.props.field.of),
      TextFormattingOnKeyDown(),
      ListItemOnEnterKey(),
      TextBlockOnEnterKey()
    ]
  }

  handleInsertBlock = item => {
    const {value, onChange, field} = this.props

    const type = item.type
    const ofField = field.of.find(it => it.type === type)
    const addItemValue = this.context.formBuilder.createFieldValue(undefined, ofField)

    const nextState = value.state
      .transform()
      .insertBlock({
        type: type,
        isVoid: true,
        data: {
          value: addItemValue
        }
      })
      .apply()

    onChange({patch: {localState: nextState}})
  }

  handleEditorChange = nextState => {
    this.props.onChange({patch: {localState: nextState}})
  }

  handleOnClickMarkButton = (event, type) => {
    event.preventDefault()
    const {value, onChange} = this.props
    const nextState = value.state
      .transform()
      .toggleMark(type)
      .apply()
    onChange({patch: {localState: nextState}})
  }

  handleSelectListFormatting = selectedValue => {
    const {value, onChange} = this.props
    const {state} = value
    const setBlock = {
      type: selectedValue.field.type,
      data: pick(selectedValue.field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    }
    let transform = state.transform()
    SLATE_LIST_BLOCKS.forEach(type => {
      transform = transform.unwrapBlock(type)
    })
    if (setBlock.type === SLATE_DEFAULT_NODE) {
      transform.setBlock(setBlock)
    } else {
      transform = transform
        .setBlock(SLATE_LIST_ITEM_TYPE)
        .wrapBlock(setBlock)
    }
    const nextState = transform.apply()
    onChange({patch: {localState: nextState}})
  }

  handleSelectBlockFormatting = selectedValue => {
    const {field} = selectedValue
    const {value, onChange} = this.props
    const {state} = value
    const {selection, startBlock, endBlock} = state
    const block = {
      type: field.type,
      data: pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    }
    let transform = state.transform()

    if (this.isWithinList()) {
      SLATE_LIST_BLOCKS.forEach(type => {
        transform = transform.unwrapBlock(type)
      })
      transform = transform
        .setBlock(block)
      const nextState = transform.apply()
      onChange({patch: {localState: nextState}})
      return
    }

    // If a single block is selected partially, split block conditionally (selection in start, middle or end of text)
    if (startBlock === endBlock
      && selection.isExpanded
      && !(
        selection.hasStartAtStartOf(startBlock)
        && selection.hasEndAtEndOf(startBlock
      )
    )) {
      const hasTextBefore = !selection.hasStartAtStartOf(startBlock)
      const hasTextAfter = !selection.hasEndAtEndOf(startBlock)
      if (hasTextAfter) {
        const extendForward = selection.isForward
          ? (selection.focusOffset - selection.anchorOffset)
          : (selection.anchorOffset - selection.focusOffset)
        transform
          .collapseToStart()
          .splitBlock()
          .moveForward()
          .extendForward(extendForward)
          .collapseToEnd()
          .splitBlock()
          .collapseToStartOfPreviousText()
      } else {
        transform = hasTextBefore ? (
          transform
            .collapseToStart()
            .splitBlock()
            .moveForward()
        ) : (
          transform
            .collapseToEnd()
            .splitBlock()
            .moveTo(selection)
        )
      }
    }
    transform
      .setBlock(block)
    const nextState = transform.apply()
    onChange({patch: {localState: nextState}})
  }

  hasMark(type) {
    const {value} = this.props
    return value.state.marks.some(mark => mark.type == type)
  }

  hasBlock(field) {
    const {value} = this.props
    return value.state.blocks.some(node => node.type === field.type
        && isEqual(
          pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(node.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    )
  }

  isWithinList() {
    const {value} = this.props
    const {state} = value
    return state.blocks.some(block => block.type === SLATE_LIST_ITEM_TYPE)
  }

  hasParentBlock(field) {
    const {value} = this.props
    const {state} = value
    const {document} = state
    return state.blocks.some(node => {
      const parent = document.getParent(node)
      return parent && parent.data && parent.type === field.type
        && isEqual(
          pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(parent.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    })
  }

  renderTextFormattingToolbar() {
    const {value} = this.props
    if (!value.state.blocks) {
      return null
    }
    const anchorBlock = value.state.blocks
      .filter(node => SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE)
        .includes(node.type) && value.state.selection.hasAnchorIn(node)
      )
      .map(node => node.type).toArray()[0]
    if (!anchorBlock) {
      return null
    }
    const marksField = this.groupedFields.slate.find(field => field.type === anchorBlock)
    if (!marksField) {
      return null
    }
    const allowedMarks = marksField.marks
    return allowedMarks.length ? (
      <div className={styles.textFormattingToolbar}>
        {allowedMarks.map(this.renderMarkButton)}
      </div>
    ) : null
  }

  renderListFormattingToolbar() {
    if (!this.groupedFields.slate.filter(field => SLATE_LIST_BLOCKS.includes(field.type)).length) {
      return null
    }
    const listItemField = this.groupedFields.slate.find(field => field.type === SLATE_LIST_ITEM_TYPE)
    const defaultField = this.groupedFields.slate.find(field => field.type === SLATE_DEFAULT_NODE)
    const items = [
      {
        key: 'listFormat-none',
        preview: () => <div>None</div>,
        field: defaultField,
        title: 'None',
        isMultiple: false,
        isActive: !this.hasBlock(listItemField)
      }
    ].concat(this.groupedFields.slate
      .filter(field => SLATE_LIST_BLOCKS.includes(field.type))
      .map((field, index) => {
        return {
          key: `listFormat-${index}`,
          preview: this.slateSchema.nodes[field.type],
          field: field,
          title: ` ${field.title}`,
          isMultiple: false,
          isActive: this.hasParentBlock(field)
        }
      })
    )
    return (
      <BlockFormatSelect
        items={items}
        label="Bullets & Lists"
        value={items.find(item => item.isActive)}
        onChange={this.handleSelectListFormatting}
      />
    )
  }

  renderBlockFormattingToolbar() {
    if (!this.groupedFields.slate.length) {
      return null
    }
    let value = null
    let items = this.groupedFields.slate
      .filter(field => {
        return this.isWithinList()
          ? SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE).includes(field.type)
          : SLATE_TEXT_BLOCKS.includes(field.type)
      })
      .map((field, index) => {
        return {
          key: `blockFormat-${index}`,
          isMultiple: false,
          preview: this.slateSchema.nodes[field.type],
          field: field,
          disabled: field.type === SLATE_LIST_ITEM_TYPE,
          title: ` ${field.title}`,
          isActive: this.hasBlock(field)
        }
      })
    const activeItems = items.filter(item => item.isActive)
    const hasMultipleFormatting = activeItems.length > 1
    if (hasMultipleFormatting) {
      items = items.map(item => {
        if (item.isActive) {
          return Object.assign(item, {isActive: false, isMultiple: true})
        }
        return item
      })
      value = {
        key: 'blockFormat-multiple',
        preview: () => <div>Multiple</div>,
        field: null,
        title: 'Multiple',
        isActive: true
      }
    }
    if (activeItems.length === 0) {
      value = {
        key: 'blockFormat-none',
        preview: () => <div>None</div>,
        field: null,
        title: 'None',
        isActive: true
      }
    }
    return (
      <BlockFormatSelect
        items={items}
        label="Text"
        value={value || items.find(item => item.isActive)}
        onChange={this.handleSelectBlockFormatting}
      />
    )
  }

  renderMarkButton = type => {
    const isActive = this.hasMark(type)
    const onMouseDown = event => this.handleOnClickMarkButton(event, type)
    return (
      <DefaultButton key={`markButton${type}`} onMouseDown={onMouseDown} inverted={isActive}>
        {type}
      </DefaultButton>
    )
  }

  renderInsertMenu() {
    const items = this.groupedFields.formBuilder.map(ofField => {
      return {
        type: ofField.type,
        title: ofField.title,
        disabled: this.isWithinList()
      }
    })

    return (
      <DropDownButton items={items} onAction={this.handleInsertBlock}>
        Insert
      </DropDownButton>

    )
  }

  render() {
    const {validation, value} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        {this.renderInsertMenu()}
        {this.renderBlockFormattingToolbar()}
        {this.renderListFormattingToolbar()}
        {this.renderTextFormattingToolbar()}
        <Editor
          className={styles.input}
          onChange={this.handleEditorChange}
          placeholder=""
          state={value.state}
          plugins={this.slatePlugins}
          schema={this.slateSchema}
        />
      </div>
    )
  }
}
