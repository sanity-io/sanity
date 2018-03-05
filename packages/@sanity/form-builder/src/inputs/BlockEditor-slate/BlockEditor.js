import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import {Data, State} from 'slate'
import {Editor} from 'slate-react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen?'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {uniqueId} from 'lodash'

import FormField from 'part:@sanity/components/formfields/default'
import Toolbar from './toolbar/Toolbar'
import createBlockEditorOperations from './createBlockEditorOperations'
import prepareSlateForBlockEditor from './util/prepareSlateForBlockEditor'
import initializeSlatePlugins from './util/initializeSlatePlugins'

import styles from './styles/BlockEditor.css'
import {SLATE_SPAN_TYPE} from './constants'
const NOOP = () => {}

export default class BlockEditor extends React.Component {
  static propTypes = {
    type: PropTypes.any,
    level: PropTypes.number,
    value: PropTypes.instanceOf(State),
    markers: PropTypes.arrayOf(PropTypes.shape({type: PropTypes.string.isRequired})),
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    readOnly: PropTypes.bool,
    onNodePatch: PropTypes.func
  }

  static defaultProps = {
    onChange() {},
    markers: []
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    fullscreen: false,
    toolbarStyle: {},
    preventScroll: false,
    editorHasFocus: false
  }

  _inputId = uniqueId('SlateBlockEditor')

  constructor(props, context) {

    super(props, context)

    const preparation = prepareSlateForBlockEditor(this)
    this.slateSchema = preparation.slateSchema
    this.textStyles = preparation.textStyles
    this.listItems = preparation.listItems
    this.annotationTypes = preparation.annotationTypes
    this.customBlocks = preparation.customBlocks
    this.operations = createBlockEditorOperations(this)
    this.slatePlugins = initializeSlatePlugins(this)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
    // this._inputContainer.addEventListener('mousewheel', this.handleInputScroll)
    this.checkScrollHeight()
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
    // this._inputContainer.removeEventListener('mousewheel', this.handleInputScroll)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      this.checkScrollHeight()
    }
  }

  checkScrollHeight = () => {
    if (!this._inputContainer || !this._editorWrapper) {
      return
    }

    const inputHeight = this._inputContainer.offsetHeight
    const contentHeight = this._editorWrapper.offsetHeight

    if (contentHeight > inputHeight) {
      this.setState({
        preventScroll: true
      })
    }

  }

  handleNodePatch = event => this.props.onNodePatch(event)

  handleInsertBlock = item => {
    if (item.options && item.options.inline) {
      this.operations.insertInline(item)
      return
    }
    this.operations.insertBlock(item)
  }

  handleOnClickMarkButton = mark => {
    this.operations.toggleMark(mark)
  }

  handleOnClickListFormattingButton = (listItem, isActive) => {
    this.editor.focus()
    this.operations.toggleListItem(listItem, isActive)
  }

  handleAnnotationButtonClick = annotation => {
    this.editor.focus()
    if (annotation.active) {
      const {value} = this.props
      const spans = value.inlines.filter(inline => inline.type == SLATE_SPAN_TYPE)
      spans.forEach(span => {
        this.operations.removeAnnotationFromSpan(span, annotation.type)
      })
      return
    }
    this.operations.createFormBuilderSpan(annotation.type)
  }

  hasAnnotationType(annotationType) {
    const {value} = this.props
    const spans = value.inlines.filter(inline => inline.type == SLATE_SPAN_TYPE)
    return spans.some(span => {
      const annotations = span.data.get('annotations') || {}
      return Object.keys(annotations).find(key => annotations[key]._type === annotationType.name)
    })
  }

  getActiveAnnotations() {
    const {value} = this.props
    const {focusBlock} = value
    const disabled = value.inlines.some(inline => inline.type !== SLATE_SPAN_TYPE)
      || (focusBlock ? (focusBlock.isVoid || focusBlock.text === '') : false)
    return this.annotationTypes.map(annotationType => {
      const active = this.hasAnnotationType(annotationType)
      return {
        active: active,
        type: annotationType,
        disabled: disabled
      }
    })
  }

  hasStyle(styleName) {
    const {value} = this.props
    return value.blocks.some(block => block.data.get('style') === styleName)
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
      value = [
        {
          key: 'blockFormat-none',
          preview: null,
          type: null,
          title: 'No style',
          active: true
        }
      ]
    }
    return {
      items: items,
      value: value
    }
  }

  handleBlockStyleChange = selectedValue => {
    this.operations.setBlockStyle(selectedValue.style.value)
    this.refreshCSS()
  }

  hasDecorator(decoratorName) {
    const {value} = this.props
    return value.marks.some(mark => mark.type == decoratorName)
  }

  getActiveDecorators() {
    return Object.keys(this.slateSchema.marks).map(decorator => {
      return {
        type: decorator,
        active: this.hasDecorator(decorator)
      }
    })
  }

  hasListItem(listItem) {
    const {value} = this.props
    return value.blocks.some(block => {
      return block.data.get('listItem') === listItem
    })
  }

  getListItems() {
    return this.listItems
      .map((item, index) => {
        return {
          type: item.value,
          title: item.title,
          active: this.hasListItem(item.value)
        }
      })
  }

  handleToggleFullscreen = () => {
    this.setState(prevState => ({fullscreen: !prevState.fullscreen}))
  }

  focus() {
    this.editor.focus()
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

  handleEditorFocus = event => {
    this.props.onFocus()
    this.setState({
      editorHasFocus: true
    })
  }

  handleEditorBlur = event => {
    this.setState({
      editorHasFocus: false
    })
  }

  handleInputScroll = event => {
    // Prevents the parent container to scroll when user tries
    // to scroll to the top/bottom of the block editor with momentum scroll or
    // a speedy mouse wheel
    // This makes the block-editor more usable when scrolling inside it.

    /*
    Enable this when activeOnFocus is finished

    const el = this._inputContainer
    const scrollTop = el.scrollTop
    const scrollHeight = el.scrollHeight
    const height = el.clientHeight

    if (this.state.fullscreen) {
      return
    }

    if (event.nativeEvent.deltaY <= 0) {
      // scrolling up
      if (scrollTop <= 0) {
        event.preventDefault()
      }
    } else if (scrollTop + height >= scrollHeight) {
      // scrolling down
      event.preventDefault()
    }
    */
  }

  setInputContainerElement = element => {
    this._inputContainer = element
  }

  setEditorWrapper = element => {
    this._editorWrapper = element
  }

  renderBlockEditor() {
    const {value, onChange, readOnly} = this.props
    const {fullscreen, toolbarStyle, preventScroll, editorHasFocus} = this.state

    return (
      <div
        className={`${styles.root} ${fullscreen ? styles.fullscreen : ''}`}
      >
        {!readOnly && (
          <Toolbar
            className={styles.toolbar}
            onInsertBlock={this.handleInsertBlock}
            insertBlocks={this.customBlocks}
            onFullscreenEnable={this.handleToggleFullscreen}
            fullscreen={this.state.fullscreen}
            onMarkButtonClick={this.handleOnClickMarkButton}
            onAnnotationButtonClick={this.handleAnnotationButtonClick}
            onListButtonClick={this.handleOnClickListFormattingButton}
            onBlockStyleChange={this.handleBlockStyleChange}
            listItems={this.getListItems()}
            blockStyles={this.getBlockStyles()}
            annotations={this.getActiveAnnotations()}
            decorators={this.getActiveDecorators()}
            style={toolbarStyle}
          />
        )}
        <ActivateOnFocus
          isActive={editorHasFocus || fullscreen || !preventScroll}
          message={readOnly ? 'Click to scroll' : 'Click to edit'}
        >
          <div
            className={styles.inputContainer}
            id={this._inputId}
            onClick={this.handleEditorContainerClick}
            ref={this.setInputContainerElement}
            onWheel={this.handleInputScroll}
          >
            <div ref={this.setEditorWrapper}>
              <Editor
                ref={this.refEditor}
                className={styles.input}
                onChange={readOnly ? NOOP : onChange}
                placeholder=""
                readOnly={readOnly}
                state={value}
                blockEditor={this}
                plugins={this.slatePlugins}
                schema={this.slateSchema}
                onFocus={this.handleEditorFocus}
                onBlur={this.handleEditorBlur}
              />
              <div
                ref={this.refBlockDragMarker}
                style={{display: 'none'}}
                className={styles.blockDragMarker}
              />
            </div>
          </div>
        </ActivateOnFocus>
      </div>
    )
  }

  handleFullScreenScroll = event => {
    const threshold = 100
    const scrollTop = event.target.scrollTop
    let ratio = scrollTop / threshold
    if (ratio >= 1) {
      ratio = 1
    }
    this.setState({
      toolbarStyle: {
        backgroundColor: `rgba(255, 255, 255, ${ratio * 0.95})`,
        boxShadow: `0 2px ${5 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
      }
    })
  }

  handleFullScreenClose = () => {
    this.setState({
      fullscreen: false
    })
  }

  render() {
    const {type, level, markers} = this.props
    const {fullscreen} = this.state
    const blockEditor = this.renderBlockEditor()

    return (
      <FormField
        markers={markers}
        label={type.title}
        description={type.description}
        labelFor={this._inputId}
        level={level}
      >
        <button type="button" tabIndex={0} className={styles.focusSkipper} onClick={() => this.focus()}>
          Jump to editor
        </button>
        {fullscreen ? (
          <FullscreenDialog isOpen onClose={this.handleFullScreenClose}>
            <ScrollContainer className={styles.portal} onScroll={this.handleFullScreenScroll}>
              {blockEditor}
            </ScrollContainer>
          </FullscreenDialog>
        ) : (
          blockEditor
        )}
      </FormField>
    )
  }
}
