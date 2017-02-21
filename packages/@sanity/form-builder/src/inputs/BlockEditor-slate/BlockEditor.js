import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {Editor, State, Data} from 'slate'
import Portal from 'react-portal'
import {uniqueId} from 'lodash'

import FormField from 'part:@sanity/components/formfields/default'
import Toolbar from './toolbar/Toolbar'
import createBlockEditorOperations from './createBlockEditorOperations'
import prepareSlateForBlockEditor from './util/prepareSlateForBlockEditor'
import {openSpanDialog} from './util/spanHelpers'

import styles from './styles/BlockEditor.css'
import {SLATE_SPAN_TYPE} from './constants'

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

  state = {fullscreen: false}

  _inputId = uniqueId('SlateBlockEditor')

  constructor(props, context) {

    super(props, context)

    const preparation = prepareSlateForBlockEditor(this)
    this.slateSchema = preparation.schema
    this.textStyles = preparation.textStyles
    this.listItems = preparation.listItems
    this.slatePlugins = preparation.plugins

    this.operations = createBlockEditorOperations(this)
  }

  handleInsertItem = item => {
    this.operations.insertBlock(item)
  }

  handleOnClickMarkButton = mark => {
    this.operations.toggleMark(mark)
  }

  handleOnClickListFormattingButton = (listItem, isActive) => {
    this.editor.focus()
    this.operations.toggleListItem(listItem, isActive)
  }

  handleLinkButtonClick = linkNodes => {
    this.editor.focus()
    if (linkNodes.length) {
      // If selection contains more than one link,
      // the button will act as a "remove links"-button
      if (linkNodes.length > 1) {
        this.operations.removeSpan(linkNodes)
        return
      }
      openSpanDialog(linkNodes[0])
      return
    }
    this.operations.createFormBuilderSpan()
  }

  handleBlockStyleChange = selectedValue => {
    this.operations.setBlockStyle(selectedValue.style.value)
    this.refreshCSS()
  }

  hasMark(markName) {
    const {value} = this.props
    return value.marks.some(mark => mark.type == markName)
  }

  hasStyle(styleName) {
    const {value} = this.props
    return value.blocks.some(block => block.data.get('style') === styleName)
  }

  getActiveLinks() {
    const {value} = this.props
    return value.inlines.filter(inline => inline.type == SLATE_SPAN_TYPE).toArray()
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

  getListItems() {
    return (this.listItems)
      .map((item, index) => {
        return {
          type: item.value,
          title: item.title,
          active: this.hasListItem(item.value)
        }
      })
  }

  getBlockStyles() {
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

  // Webkit hack to force the browser to reapply CSS rules
  // This is needed to make ::before and ::after CSS rules work properly
  // under certain conditions (like the list counters for number lists)
  // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes/3485654#3485654
  refreshCSS = () => {
    const isWebkit = 'WebkitAppearance' in document.documentElement.style
    if (!isWebkit) {
      return
    }
    // Must be body because we have several scrollcontainers loosing state
    const resetNode = document.body
    resetNode.style.display = 'none'
    // eslint-disable-next-line no-unused-expressions
    resetNode.offsetHeight // Looks weird, but it actually has an effect!
    resetNode.style.display = ''
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
    const customTypes = type.of.filter(memberType => memberType.name !== 'block')

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
            onInsertItem={this.handleInsertItem}
            insertItems={customTypes || []}
            onFullscreenEnable={this.handleToggleFullscreen}
            fullscreen={this.state.fullscreen}
            onMarkButtonClick={this.handleOnClickMarkButton}
            onListButtonClick={this.handleOnClickListFormattingButton}
            onBlockStyleChange={this.handleBlockStyleChange}
            listItems={this.getListItems()}
            blockStyles={this.getBlockStyles()}
            onLinkButtonClick={this.handleLinkButtonClick}
            activeLinks={this.getActiveLinks()}
            showLinkButton
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
