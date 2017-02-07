import React, {PropTypes} from 'react'
import {Editor, State} from 'slate'
import {pick, isEqual, uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import InsertBlockOnEnter from 'slate-insert-block-on-enter'

import prepareSlateSchema from './util/prepareSlateSchema'
import styles from './styles/BlockEditor.css'

import FormBuilderNodeOnDrop from './plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from './plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from './plugins/TextFormattingOnKeyDown'
import ListItemOnEnterKey from './plugins/ListItemOnEnterKey'
import TextBlockOnEnterKey from './plugins/TextBlockOnEnterKey'
import OnPasteHtml from './plugins/OnPasteHtml'

import {
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
  SLATE_LIST_BLOCK_TYPE,
  SLATE_LIST_ITEM_TYPE,
  SLATE_TEXT_BLOCKS,
  SLATE_LINK_TYPE,
  TYPE_COMPARISON_PROPS
} from './constants'

import Toolbar from './toolbar/Toolbar'

export default class BlockEditor extends React.Component {
  static propTypes = {
    type: PropTypes.any,
    level: PropTypes.number,
    value: PropTypes.instanceOf(State),
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
    this.groupedTypes = slateSchema.types
    this.slatePlugins = [
      InsertBlockOnEnter({
        type: this.slateSchema.normalBlock.type,
        kind: 'block',
        nodes: [{kind: 'text', text: '', ranges: []}]
      }),
      OnPasteHtml(),
      FormBuilderNodeOnDrop(),
      FormBuilderNodeOnPaste(this.context.formBuilder, this.props.type.of),
      TextFormattingOnKeyDown(),
      ListItemOnEnterKey(
        this.slateSchema.normalBlock,
        SLATE_LIST_BLOCK_TYPE,
        SLATE_LIST_ITEM_TYPE
      ),
      TextBlockOnEnterKey(this.slateSchema.normalBlock.type)
    ]

    this.state = {
      fullscreen: false
    }
  }

  handleInsertBlockorInline = item => {
    const {value, onChange} = this.props
    const addItemValue = this.context.formBuilder.createFieldValue(undefined, item)
    const props = {
      type: item.type.name,
      isVoid: true,
      data: {
        value: addItemValue
      }
    }
    let transform = value.transform()
    if (item.options && item.options.inline) {
      transform = transform.insertInline(props)
    } else {
      transform = transform.insertBlock(props)
    }
    const nextState = transform.apply()

    onChange(nextState)
  }

  handleOnClickMarkButton = (event, type) => {
    event.preventDefault()
    const {value, onChange} = this.props
    const nextState = value
      .transform()
      .toggleMark(type)
      .apply()
    onChange(nextState)
  }


  handleOnClickListFormattingButton = (event, listStyle, active) => {
    const {value, onChange} = this.props
    const type = this.groupedTypes.slate
      .find(sType => sType.listItem === listStyle)
    const setBlock = {
      type: SLATE_LIST_BLOCK_TYPE,
      data: {type: type}
    }
    let transform = value.transform()

    if (active) {
      transform = transform
        .setBlock(SLATE_LIST_ITEM_TYPE)
        .wrapBlock(setBlock)
    } else {
      // TODO: there is a bug here if the list item is empty
      // Then in will be unwrapped into an listItem and not a normal node
      transform = transform
        .setBlock(this.slateSchema.normalBlock)
        .unwrapBlock(SLATE_LIST_BLOCK_TYPE)
    }
    const nextState = transform.apply()
    onChange(nextState)
  }


  handleSelectBlockFormatting = selectedValue => {
    const {type} = selectedValue
    const {value, onChange} = this.props
    const {selection, startBlock, endBlock} = value
    const block = {
      type: type.style,
      data: {type: type}
    }
    let transform = value.transform()

    if (this.isWithinList()) {
      transform = transform.unwrapBlock(SLATE_LIST_BLOCK_TYPE)
        .setBlock(block)
      const nextState = transform.apply()
      onChange(nextState)
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
    onChange(nextState)
  }

  handleOnClickLinkButton = (href, target, text) => {
    const {value, onChange} = this.props
    let transform = value.transform()

    if (!href) {
      transform = transform
       .unwrapInline(SLATE_LINK_TYPE)
       .focus()
    } else if (href) {
      if (value.isExpanded) {
        transform = transform
          .unwrapInline(SLATE_LINK_TYPE)
          .wrapInline({
            type: SLATE_LINK_TYPE,
            data: {href: href, target: target}
          })
          .focus()
      } else {
        const linkNode = value.inlines
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
    onChange(nextState)
  }

  hasMark(type) {
    const {value} = this.props
    return value.marks.some(mark => mark.type == type)
  }

  hasBlock(type) {
    const {value} = this.props
    return value.blocks.some(node => node.type === type.style
        && isEqual(
          pick(type, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(node.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    )
  }

  hasLinks() {
    const {value} = this.props
    return value.inlines.some(inline => inline.type == SLATE_LINK_TYPE)
  }

  isWithinList() {
    const {value} = this.props
    return value.blocks.some(block => block.type === SLATE_LIST_ITEM_TYPE)
  }


  hasParentBlock(type) {
    const {value} = this.props
    return value.blocks.some(block => {
      const parent = value.get('document').getParent(block.key)
      return parent && parent.data
        && isEqual(
          pick(parent.data.get('type'), TYPE_COMPARISON_PROPS),
          pick(type, TYPE_COMPARISON_PROPS)
        )
    })
  }

  getActiveMarks() {
    const {value} = this.props
    if (!value.blocks) {
      return []
    }
    const anchorBlock = value.blocks
      .filter(node => SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE)
        .includes(node.type) && value.selection.hasAnchorIn(node)
      )
      .map(node => node.type).toArray()[0]
    if (!anchorBlock) {
      return []
    }
    const marksField = this.groupedTypes.slate.find(type => type.style === anchorBlock)
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


  getListTypes() {
    return (this.groupedTypes.slate)
      .filter(type => type.listItem)
      .map((type, index) => {
        return {
          type: type.listItem,
          title: type.title,
          active: this.hasParentBlock(type)
        }
      })
  }

  getStyles() {
    if (!this.groupedTypes.slate.length) {
      return []
    }
    const items = this.groupedTypes.slate
      .filter(type => {
        return type.style
      })
      .map((type, index) => {
        return {
          key: `blockFormat-${index}`,
          preview: this.slateSchema.nodes[type.style](
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
    if (!value.inlines) {
      return null
    }
    if (this.hasLinks()) {
      const linkNode = value.inlines
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
    this.props.onChange(nextState)
  }

  render() {
    const {validation, value, type, level} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    const inputId = uniqueId('FormBuilderText')
    const activeLink = this.getActiveLink()
    const showLinkButton = (value.selection && value.selection.isExpanded)
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
            onInsertBlock={this.handleInsertBlockorInline}
            insertBlocks={this.groupedTypes.formBuilder || []}
            onFullscreenEnable={this.handleToggleFullscreen}
            fullscreen={this.state.fullscreen}
            onMarkButtonClick={this.handleOnClickMarkButton}
            onListButtonClick={this.handleOnClickListFormattingButton}
            onFormatSelectChange={this.handleSelectBlockFormatting}
            listFormats={this.getListTypes()}
            textFormats={this.getStyles()}
            onLinkButtonClick={this.handleOnClickLinkButton}
            activeLink={activeLink}
            showLinkButton={showLinkButton}
            marks={this.getActiveMarks()}
          />
          <div className={styles.inputContainer} id={inputId}>
            <Editor
              className={styles.input}
              onChange={this.handleEditorChange}
              placeholder=""
              state={value}
              plugins={this.slatePlugins}
              schema={this.slateSchema}
            />
          </div>
        </div>
      </FormField>
    )
  }
}
