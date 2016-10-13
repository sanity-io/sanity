import React, {PropTypes} from 'react'
import getWindow from 'get-window'
import ReactDOM from 'react-dom'
import {IS_FIREFOX} from 'slate/lib/constants/environment'
import OffsetKey from 'slate/lib/utils/offset-key'
import Selection from 'slate/lib/models/selection'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import styles from './styles/BlockPreview.css'

const stopPropagation = event => event.stopPropagation()

export default function createFormBuilderPreviewNode(ofField) {
  return class PreviewNode extends React.Component {
    static propTypes = {
      node: PropTypes.object,
      editor: PropTypes.object,
      state: PropTypes.object,
      attributes: PropTypes.object
    }

    constructor(props) {
      super(props)
      this._containerElement = null
      this._dropTarget = null
      this._editorNode = null
      this.state = {isDragging: false, isFocused: false}
    }

    componentDidMount() {
      const {editor} = this.props
      this._editorNode = ReactDOM.findDOMNode(editor)
      this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    }

    componentWillUnmount() {
      this._editorNode.removeEventListener('dragover', this.handleDragOverOtherNode)
    }

    componentWillUpdate(nextProps) {
      const {node} = this.props
      const selection = nextProps.state.selection
      if (selection !== this.props.state.selection) {
        const isFocused = selection.hasFocusIn(node)
        this.setState({isFocused: isFocused})
      }
    }

    handleDragOverOtherNode = event => {
      const {state} = this.props
      const window = getWindow(event.target)
      const {x, y} = event
      // Resolve the point where the drag is now
      let range
      // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
      if (window.document.caretRangeFromPoint) {
        range = window.document.caretRangeFromPoint(x, y)
      } else {
        range = window.document.createRange()
        range.setStart(event.rangeParent, event.rangeOffset)
      }

      const point = this.getPoint(event.target, range ? range.startOffset : 0)
      const offset = point.offset > point.end / 2 ? point.end : 0
      const target = Selection.create({
        anchorKey: point.key,
        anchorOffset: offset, // TODO: point.offset if inline block?
        focusKey: point.key,
        focusOffset: offset, // TODO: point.offset if inline block?
        isFocused: true
      })
      const targetNodes = state.document.nodes.toArray().filter(node => {
        if ((offset === 0 && target.hasEdgeAtStartOf(node)) || (offset !== 0 && target.hasEdgeAtEndOf(node))) {
          return true
        }
        return false
      })
      target.node = targetNodes[0]
      target.isAtStart = offset === 0
      this._dropTarget = target
    }

    handleChange = event => {
      const {node, editor} = this.props
      const next = editor.getState()
        .transform()
        .setNodeByKey(node.key, {
          data: {value: node.data.get('value').patch(event.patch)}
        })
        .apply()

      editor.onChange(next)
    }

    handleDragStart = event => {
      // Cancel event if not dragging the containerelement itself,
      // so we can't drag single elements (like image preview, texts etc) out of the field itself
      if (event.target !== this._containerElement) {
        event.preventDefault()
        this.setState({isDragging: false})
        return
      }
      if (IS_FIREFOX) {
        // Firefox needs this in able for dragging to work
        event.dataTransfer.setData('text/plain', '')
        // When focus bug for Firefox in Slate is fixed (https://github.com/ianstormtaylor/slate/issues/297)
        // this should be tried, so that caret is moved only in start or end of node through the handleDrag function
        // like in Chrome and Safari.
        // event.dataTransfer.setData('application/x-moz-node', null)
      }
      event.dataTransfer.effectAllowed = 'none'
      this.setState({isDragging: true})
    }

    handleDrag = event => {
      const {editor, state} = this.props
      if (this._dropTarget) {
        const next = state.transform()
          .moveTo(this._dropTarget)
          .apply()
        editor.onChange(next)
      }
    }

    handleDragEnd = event => {
      const {editor, state, node} = this.props
      const target = this._dropTarget
      if (!target || target.node === node) {
        return
      }
      let next = state.transform()
      next = next.removeNodeByKey(node.key)
      if (target.isAtStart) {
        next = next.collapseToStartOf(target.node)
      } else {
        next = next.collapseToEndOf(target.node)
      }
      next = next.insertBlock(node)
        .apply()
      editor.onChange(next)
      this.setState({isDragging: false})
      this._dropTarget = null
    }

    handleCancelEvent = event => {
      event.preventDefault()
    }

    getPoint(element, offset) {
      const {editor, state} = this.props
      const {document} = state
      const schema = editor.getSchema()
      const offsetKey = OffsetKey.findKey(element, offset)
      const {key} = offsetKey
      const node = document.getDescendant(key)
      const decorators = document.getDescendantDecorators(key, schema)
      const ranges = node.getRanges(decorators)
      const point = OffsetKey.findPoint(offsetKey, ranges)
      return point
    }

    getValue() {
      return this.props.node.data.get('value')
    }

    renderPreview() {
      return (
        <ItemPreview
          field={ofField}
          value={this.getValue()}
        />
      )
    }

    renderInput() {
      return this.state.isFocused && !this.state.isDragging ? (
        <div onClick={stopPropagation}>
          <ItemForm
            onDrop={this.handleCancelEvent}
            field={ofField}
            level={0}
            value={this.getValue()}
            onChange={this.handleChange}
          />
        </div>
      ) : null
    }

    refContainerElement = elm => {
      this._containerElement = elm
    }

    render() {
      const className = this.state.isFocused ? styles.active : styles.root

      return (
        <div
          {...this.props.attributes}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onDragOver={this.handleCancelEvent}
          onDragLeave={this.handleCancelEvent}
          onDrop={this.handleCancelEvent}
          draggable
          ref={this.refContainerElement}
          className={className}
        >
          {this.renderPreview()}
          {this.renderInput()}
        </div>
      )
    }
  }
}
