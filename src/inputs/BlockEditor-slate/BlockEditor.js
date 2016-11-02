import React, {PropTypes} from 'react'
import {Editor} from 'slate'
import {pick, isEqual} from 'lodash'
import InsertBlockOnEnter from 'slate-insert-block-on-enter'

import prepareSlateSchema from './util/prepareSlateSchema'
import createLocalStatePatch from './util/createLocalStatePatch'
import styles from './styles/BlockEditor.css'

import SlateValueContainer from './SlateValueContainer'

import FormBuilderNodeOnDrop from './plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from './plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from './plugins/TextFormattingOnKeyDown'
import ListItemOnEnterKey from './plugins/ListItemOnEnterKey'
import TextBlockOnEnterKey from './plugins/TextBlockOnEnterKey'

import {
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
  SLATE_LIST_BLOCKS,
  SLATE_LIST_ITEM_TYPE,
  SLATE_DEFAULT_NODE,
  SLATE_TEXT_BLOCKS
} from './constants'

import Toolbar from './toolbar/Toolbar'

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

    this.state = {
      fullscreen: false
    }
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

    onChange({patch: createLocalStatePatch(nextState)})
  }

  handleOnClickMarkButton = (event, type) => {
    event.preventDefault()
    const {value, onChange} = this.props
    const nextState = value.state
      .transform()
      .toggleMark(type)
      .apply()
    onChange({patch: createLocalStatePatch(nextState)})
  }


  handleOnClickListFormattingButton = (event, listStyle, active) => {
    const {value, onChange} = this.props
    const {state} = value
    const field = this.groupedFields.slate
      .find(sfield => SLATE_LIST_BLOCKS.includes(sfield.type) && sfield.listStyle === listStyle)
    const setBlock = {
      type: field.type,
      data: pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    }
    let transform = state.transform()
    SLATE_LIST_BLOCKS.forEach(type => {
      transform = transform.unwrapBlock(type)
    })
    if (active) {
      if (setBlock.type === SLATE_DEFAULT_NODE) {
        transform.setBlock(setBlock)
      } else {
        transform = transform
          .setBlock(SLATE_LIST_ITEM_TYPE)
          .wrapBlock(setBlock)
      }
    } else {
      transform = transform
        .setBlock(SLATE_DEFAULT_NODE)
    }
    const nextState = transform.apply()
    onChange({patch: createLocalStatePatch(nextState)})
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
      onChange({patch: createLocalStatePatch(nextState)})
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
    onChange({patch: createLocalStatePatch(nextState)})
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

  getActiveMarks() {
    const {value} = this.props
    if (!value.state.blocks) {
      return []
    }
    const anchorBlock = value.state.blocks
      .filter(node => SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE)
        .includes(node.type) && value.state.selection.hasAnchorIn(node)
      )
      .map(node => node.type).toArray()[0]
    if (!anchorBlock) {
      return []
    }
    const marksField = this.groupedFields.slate.find(field => field.type === anchorBlock)
    if (!marksField || !marksField.marks) {
      return []
    }
    return marksField.marks.map(mark => {
      return {
        type: mark,
        active: this.hasMark(mark)
      }
    })
  }


  getListFormats() {
    if (!this.groupedFields.slate.filter(field => SLATE_LIST_BLOCKS.includes(field.type)).length) {
      return []
    }
    return this.groupedFields.slate
      .filter(field => SLATE_LIST_BLOCKS.includes(field.type))
      .map((field, index) => {
        return {
          type: field.listStyle,
          title: field.title,
          active: this.hasParentBlock(field)
        }
      })
  }

  getTextFormats() {
    if (!this.groupedFields.slate.length) {
      return null
    }
    let value = null
    const items = this.groupedFields.slate
      .filter(field => {
        return this.isWithinList()
          ? SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE).includes(field.type)
          : SLATE_TEXT_BLOCKS.includes(field.type)
      })
      .map((field, index) => {
        return {
          key: `blockFormat-${index}`,
          multiple: false,
          preview: this.slateSchema.nodes[field.type](
            Object.assign(
              {isPreview: true},
              {children: <span>{field.title}</span>},
              pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
            )
          ),
          field: field,
          disabled: field.type === SLATE_LIST_ITEM_TYPE,
          title: ` ${field.title}`,
          active: this.hasBlock(field)
        }
      })
    const activeItems = items.filter(item => item.active)
    if (activeItems.length === 0) {
      value = {
        key: 'blockFormat-none',
        preview: () => <div>None</div>,
        field: null,
        title: 'None',
        active: true
      }
    }
    return {
      items: items,
      value: items.filter(item => item.active)
    }
  }

  handleToggleFullscreen = () => {
    this.setState({
      fullscreen: !this.state.fullscreen
    })
  }

  handleEditorChange = nextState => {
    this.props.onChange({patch: createLocalStatePatch(nextState)})
  }

  render() {
    const {validation, value} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div
        className={`
          ${hasError ? styles.error : styles.root}
          ${this.state.fullscreen && styles.fullscreen}
        `}
      >
        <Toolbar
          className={styles.toolbar}
          onInsertBlock={this.handleInsertBlock}
          insertBlocks={this.groupedFields.formBuilder || []}
          onFullscreenEnable={this.handleToggleFullscreen}
          fullscreen={this.state.fullscreen}
          onMarkButtonClick={this.handleOnClickMarkButton}
          onListButtonClick={this.handleOnClickListFormattingButton}
          onFormatSelectChange={this.handleSelectBlockFormatting}
          listFormats={this.getListFormats()}
          textFormats={this.getTextFormats()}
          marks={this.getActiveMarks()}
        />
        <div className={styles.inputContainer}>
          <Editor
            className={styles.input}
            onChange={this.handleEditorChange}
            placeholder=""
            state={value.state}
            plugins={this.slatePlugins}
            schema={this.slateSchema}
          />
        </div>
      </div>
    )
  }
}
