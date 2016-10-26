import React, {PropTypes} from 'react'
import {Editor} from 'slate'
import {isEqual, pick} from 'lodash'
import InsertBlockOnEnter from 'slate-insert-block-on-enter'

import DefaultButton from 'part:@sanity/components/buttons/default'

import prepareSlateSchema from './util/prepareSlateSchema'
import styles from './styles/BlockEditor.css'

import SlateValueContainer from './SlateValueContainer'

import FormBuilderNodeOnDrop from './plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from './plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from './plugins/TextFormattingOnKeyDown'
import ListItemOnEnterKey from './plugins/ListItemOnEnterKey'
import TextBlockOnEnterKey from './plugins/TextBlockOnEnterKey'

import Toolbar from './toolbar/Toolbar'
import InsertDropdown from './toolbar/InsertDropdown'
import TextFormatToolbar from './toolbar/TextFormat'
import ListFormat from './toolbar/ListFormat'
import BlockFormat from './toolbar/BlockFormat'

import {
  SLATE_DEFAULT_NODE,
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
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


  handleSelectBlockFormatting = selectedValue => {
    console.log('handleSelectBlockFormatting', selectedValue)
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

  renderMarkButton = type => {
    const isActive = this.hasMark(type)
    const onMouseDown = event => this.handleOnClickMarkButton(event, type)
    return (
      <DefaultButton key={`markButton${type}`} onMouseDown={onMouseDown} inverted={isActive}>
        {type}
      </DefaultButton>
    )
  }

  render() {
    const {validation, value, onChange} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        <Toolbar>
          <InsertDropdown groupedFields={this.groupedFields} onInsertBlock={this.handleInsertBlock} />
          <TextFormatToolbar value={value} groupedFields={this.groupedFields} onChange={onChange} />
          <ListFormat groupedFields={this.groupedFields} slateSchema={this.slateSchema} value={value} onChange={onChange} />
          <BlockFormat
            groupedFields={this.groupedFields}
            value={value}
            slateSchema={this.slateSchema}
            onSelect={this.handleSelectBlockFormatting}
          />
        </Toolbar>
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
