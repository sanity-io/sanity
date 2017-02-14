import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {Editor, State, Data} from 'slate'
import {uniqueId} from 'lodash'
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

import Portal from 'react-portal'

import {
  SLATE_DEFAULT_STYLE,
  SLATE_LINK_TYPE,
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

  _inputId = uniqueId('SlateBlockEditor')

  constructor(props, context) {
    super(props, context)

    const slateSchema = prepareSlateSchema(this.props.type)
    this.textStyles = slateSchema.textStyles
    this.listItems = slateSchema.listItems
    this.slateSchema = slateSchema.schema
    this.groupedTypes = slateSchema.types
    this.linkType = slateSchema.linkType
    this.slatePlugins = [
      InsertBlockOnEnter({
        type: 'contentBlock',
        kind: 'block',
        data: {
          style: SLATE_DEFAULT_STYLE
        },
        nodes: [{kind: 'text', text: '', ranges: []}]
      }),
      OnPasteHtml({link: this.linkType}, context),
      FormBuilderNodeOnDrop(),
      FormBuilderNodeOnPaste(this.context.formBuilder, this.props.type.of),
      TextFormattingOnKeyDown(),
      ListItemOnEnterKey(
        SLATE_DEFAULT_STYLE
      ),
      TextBlockOnEnterKey(SLATE_DEFAULT_STYLE)
    ]

    this.state = {
      fullscreen: false
    }
  }

  handleInsert = item => {
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
    const normalBlock = {
      type: 'contentBlock',
      data: {style: SLATE_DEFAULT_STYLE}
    }
    const listItemBlock = {
      type: 'contentBlock',
      data: {listItem: listStyle}
    }
    let transform = value.transform()

    if (active) {
      transform = transform
        .setBlock(listItemBlock)
    } else {
      transform = transform
        .setBlock(normalBlock)
    }
    const nextState = transform.apply()
    onChange(nextState)
    this.refreshCSS()
  }


  handleSelectBlockFormatting = selectedValue => {
    const {value, onChange} = this.props
    const {selection, startBlock, endBlock} = value
    const block = {
      type: 'contentBlock',
      data: {style: selectedValue.style.value}
    }
    let transform = value.transform()

    // If a single block is selected partially, split block conditionally
    // (selection in start, middle or end of text)
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
    this.refreshCSS()
  }

  handleOnClickLinkButton = isActiveLink => {
    if (isActiveLink) {
      this.removeLink()
      return
    }
    this.insertLink()
  }

  removeLink() {
    const {value, onChange} = this.props
    let transform = value.transform()
    transform = transform
      .unwrapInline(SLATE_LINK_TYPE)
      .focus()
    const nextState = transform.apply()
    onChange(nextState)
  }

  insertLink() {
    const {value, onChange} = this.props
    let transform = value.transform()

    const addItemValue = this.context.formBuilder.createFieldValue(undefined, this.linkType)
    const props = {
      type: SLATE_LINK_TYPE,
      isVoid: false,
      kind: 'inline',
      data: {
        value: addItemValue
      }
    }
    if (value.isExpanded) {
      transform = transform
        .unwrapInline(SLATE_LINK_TYPE)
        .wrapInline(props)
        .focus()
    } else {
      const linkNode = value.inlines
        .find(inline => inline.type === SLATE_LINK_TYPE)
      transform = transform
        .focus()
        .moveToRangeOf(linkNode)
        .unwrapInline(SLATE_LINK_TYPE)
        .wrapInline(props)
    }
    const nextState = transform.apply()
    onChange(nextState)
  }

  hasMark(markName) {
    const {value} = this.props
    return value.marks.some(mark => mark.type == markName)
  }

  hasBlock(type) {
    const {value} = this.props
    return value.blocks.some(block => block.type === type)
  }

  hasStyle(styleName) {
    const {value} = this.props
    return value.blocks.some(block => block.data.get('style') === styleName)
  }

  hasLinks() {
    const {value} = this.props
    return value.inlines.some(inline => inline.type == SLATE_LINK_TYPE)
  }

  isWithinList() {
    const {value} = this.props
    return value.blocks.some(block => block.data.get('listItem'))
  }

  hasListItem(listItem) {
    const {value} = this.props
    return value.blocks.some(block => {
      return block.data.get('listItem') === listItem
    })
  }

  getActiveMarks() {
    return Object.keys(this.slateSchema.marks).map(mark => {
      return {
        type: mark,
        active: this.hasMark(mark)
      }
    })
  }

  getListTypes() {
    return (this.listItems)
      .map((item, index) => {
        return {
          type: item.value,
          title: item.title,
          active: this.hasListItem(item.value)
        }
      })
  }

  getStyles() {
    function Preview(props) {
      return <span>{props.children}</span>
    }
    const items = this.textStyles
      .map((style, index) => {
        return {
          key: `blockFormat-${index}`,
          style: style,
          preview: this.slateSchema.nodes.contentBlock({
            children: [
              <Preview
                key={style.value}
                parent={{data: Data.create({style: style.value})}}
              >
                {style.title}
              </Preview>
            ]
          }),
          title: ` ${style.title}`,
          active: this.hasStyle(style.value)
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

  handleToggleFullscreen = () => {
    this.setState({
      fullscreen: !this.state.fullscreen
    })
  }

  handleEditorChange = nextState => {
    this.props.onChange(nextState)
  }

  refEditor = editor => {
    this.editor = editor
  }

  refBlockDragMarker = marker => {
    this.blockDragMarker = marker
  }

  // Hack to force the browser to reapply CSS rules
  // This is needed to make ::before and ::after CSS rules work properly
  // under certain conditions (like the list counters for number lists)
  // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes/3485654#3485654
  refreshCSS() {
    const editorDOMNode = ReactDOM.findDOMNode(this.editor)
    editorDOMNode.style.display = 'none'
    editorDOMNode.offsetHeight // eslint-disable-line no-unused-expressions
    editorDOMNode.style.display = ''
  }

  showBlockDragMarker(pos, node) {
    this.blockDragMarker.style.display = 'block'
    const editorDOMNode = ReactDOM.findDOMNode(this.editor)
    const editorRect = editorDOMNode.getBoundingClientRect()
    const elemRect = node.getBoundingClientRect()
    const topPos = elemRect.top - editorRect.top
    const bottomPos = topPos + (elemRect.bottom - elemRect.top)
    if (pos == 'after') {
      this.blockDragMarker.style.top = `${parseInt(bottomPos, 0)}px`
    } else {
      this.blockDragMarker.style.top = `${parseInt(topPos, 0)}px`
    }
  }

  hideBlockDragMarker() {
    this.blockDragMarker.style.display = 'none'
  }

  renderBlockEditor() {
    const {validation, value, type, level} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <FormField
        label={type.title}
        labelHtmlFor={this._inputId}
        level={level}
        className={this.state.fullscreen ? styles.formFieldFullscreen : styles.formField}
      >
        <div
          className={`
            ${hasError ? styles.error : styles.root}
            ${this.state.fullscreen ? styles.fullscreen : ''}
          `}
        >
          <Toolbar
            className={styles.toolbar}
            onInsertBlock={this.handleInsert}
            insertBlocks={this.groupedTypes.formBuilder || []}
            onFullscreenEnable={this.handleToggleFullscreen}
            fullscreen={this.state.fullscreen}
            onMarkButtonClick={this.handleOnClickMarkButton}
            onListButtonClick={this.handleOnClickListFormattingButton}
            onFormatSelectChange={this.handleSelectBlockFormatting}
            listFormats={this.getListTypes()}
            textFormats={this.getStyles()}
            onLinkButtonClick={this.handleOnClickLinkButton}
            activeLink={!!this.hasLinks()}
            showLinkButton={!!this.linkType}
            marks={this.getActiveMarks()}
          />
          <div className={styles.inputContainer} id={this._inputId}>
            <Editor
              ref={this.refEditor}
              className={styles.input}
              onChange={this.handleEditorChange}
              placeholder=""
              state={value}
              blockEditor={this}
              plugins={this.slatePlugins}
              schema={this.slateSchema}
            />
            <div
              ref={this.refBlockDragMarker}
              style={{display: 'none'}}
              className={styles.blockDragMarker}
            />
          </div>

        </div>
      </FormField>
    )
  }

  render() {
    const {fullscreen} = this.state
    if (fullscreen) {
      return (
        <Portal isOpened>
          {this.renderBlockEditor()}
        </Portal>
      )
    }
    return this.renderBlockEditor()
  }
}
