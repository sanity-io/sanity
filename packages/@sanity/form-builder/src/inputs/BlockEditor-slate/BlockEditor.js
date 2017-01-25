import React, {PropTypes} from 'react'
import {Editor} from 'slate'
import {pick, isEqual, uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
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
import OnPasteHtml from './plugins/OnPasteHtml'

import {
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
  SLATE_LIST_BLOCKS,
  SLATE_LIST_ITEM_TYPE,
  SLATE_DEFAULT_NODE,
  SLATE_TEXT_BLOCKS,
  SLATE_LINK_TYPE
} from './constants'

import Toolbar from './toolbar/Toolbar'

export default class BlockEditor extends React.Component {
  static valueContainer = SlateValueContainer

  static propTypes = {
    type: PropTypes.any,
    level: PropTypes.number,
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

    const slateSchema = prepareSlateSchema(this.props.type)
    this.slateSchema = slateSchema.schema
    this.groupedFields = slateSchema.fields
    this.slatePlugins = [
      InsertBlockOnEnter({kind: 'block', type: 'paragraph', nodes: [{kind: 'text', text: '', ranges: []}]}),
      OnPasteHtml(),
      FormBuilderNodeOnDrop(),
      FormBuilderNodeOnPaste(this.context.formBuilder, this.props.type.of),
      TextFormattingOnKeyDown(),
      ListItemOnEnterKey(),
      TextBlockOnEnterKey()
    ]

    this.state = {
      fullscreen: false
    }
  }

  handleInsertBlock = item => {
    const {value, onChange, type} = this.props

    const ofType = type.of.find(memberType => memberType.type === type)
    const addItemValue = this.context.formBuilder.createFieldValue(undefined, ofType)

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
    const type = this.groupedFields.slate
      .find(sfield => SLATE_LIST_BLOCKS.includes(sfield.type) && sfield.listStyle === listStyle)
    const setBlock = {
      type: type.type,
      data: pick(type, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
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
    const {type} = selectedValue
    const {value, onChange} = this.props
    const {state} = value
    const {selection, startBlock, endBlock} = state
    const block = {
      type: type.type,
      data: pick(type, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
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

  handleOnClickLinkButton = (href, target, text) => {

    const {value, onChange} = this.props
    const {state} = value
    let transform = state.transform()

    if (!href) {
      transform = transform
       .unwrapInline(SLATE_LINK_TYPE)
       .focus()
    } else if (href) {
      if (state.isExpanded) {
        transform = transform
          .unwrapInline(SLATE_LINK_TYPE)
          .wrapInline({
            type: SLATE_LINK_TYPE,
            data: {href: href, target: target}
          })
          .focus()
      } else {
        const linkNode = value.state.inlines
          .find(inline => inline.type === SLATE_LINK_TYPE)
        transform = transform
          .focus()
          .moveToRangeOf(linkNode)
          .unwrapInline(SLATE_LINK_TYPE)
          .wrapInline({
            type: SLATE_LINK_TYPE,
            data: {href: href, target: target}
          })
      }
    }
    const nextState = transform.apply()
    onChange({patch: createLocalStatePatch(nextState)})
  }

  hasMark(type) {
    const {value} = this.props
    return value.state.marks.some(mark => mark.type == type)
  }

  hasBlock(type) {
    const {value} = this.props
    return value.state.blocks.some(node => node.type === type.type
        && isEqual(
          pick(type, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(node.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    )
  }

  hasLinks() {
    const {value} = this.props
    return value.state.inlines.some(inline => inline.type == SLATE_LINK_TYPE)
  }

  isWithinList() {
    const {value} = this.props
    const {state} = value
    return state.blocks.some(block => block.type === SLATE_LIST_ITEM_TYPE)
  }

  hasParentBlock(type) {
    const {value} = this.props
    const {state} = value
    const {document} = state
    return state.blocks.some(node => {
      const parent = document.getParent(node.key)
      return parent && parent.data && parent.type === type.type
        && isEqual(
          pick(type, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
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
    const marksField = this.groupedFields.slate.find(type => type.type === anchorBlock)
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
    if (!this.groupedFields.slate.filter(type => SLATE_LIST_BLOCKS.includes(type.type)).length) {
      return []
    }
    return this.groupedFields.slate
      .filter(type => SLATE_LIST_BLOCKS.includes(type.type))
      .map((type, index) => {
        return {
          type: type.listStyle,
          title: type.title,
          active: this.hasParentBlock(type)
        }
      })
  }

  getTextFormats() {
    if (!this.groupedFields.slate.length) {
      return []
    }
    const items = this.groupedFields.slate
      .filter(type => SLATE_TEXT_BLOCKS.includes(type.type))
      .map((type, index) => {
        return {
          key: `blockFormat-${index}`,
          preview: this.slateSchema.nodes[type.type](
            Object.assign(
              {isPreview: true},
              {children: <span>{type.title}</span>},
              pick(type, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
            )
          ),
          type: type,
          title: ` ${type.title}`,
          active: this.hasBlock(type)
        }
      })
    let value = items.filter(item => item.active)
    if (value.length === 0) {
      value = [{
        key: 'blockFormat-none',
        preview: null,
        type: null,
        title: 'No style',
        active: true
      }]
    }
    return {
      items: items,
      value: value
    }
  }

  getActiveLink() {
    const {value} = this.props
    if (!value.state.inlines) {
      return null
    }
    if (this.hasLinks()) {
      const linkNode = value.state.inlines
        .find(inline => inline.type === SLATE_LINK_TYPE)
      if (linkNode) {
        return {
          href: linkNode.data.get('href'),
          target: linkNode.data.get('target')
        }
      }
      return null
    }
    return null
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
    const {validation, value, type, level} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    const inputId = uniqueId('FormBuilderText')
    const activeLink = this.getActiveLink()
    const showLinkButton = (value.state.selection && value.state.selection.isExpanded)
      || !!activeLink

    return (
      <FormField label={type.title} labelHtmlFor={inputId} level={level}>
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
            onLinkButtonClick={this.handleOnClickLinkButton}
            activeLink={activeLink}
            showLinkButton={showLinkButton}
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
      </FormField>
    )
  }
}
