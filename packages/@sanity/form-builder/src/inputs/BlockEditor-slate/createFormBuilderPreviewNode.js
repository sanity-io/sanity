import React, {PropTypes} from 'react'
import getWindow from 'get-window'
import ReactDOM from 'react-dom'
import OffsetKey from 'slate/lib/utils/offset-key'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import blockStyles from './styles/BlockPreview.css'
import inlineStyles from './styles/InlinePreview.css'

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
      this._dropTarget = null
      this._editorNode = null
      this._isInline = ofField.options && ofField.options.inline
      this.state = {isFocused: false, isEditing: false}
    }

    componentDidMount() {
      const {editor} = this.props
      this._editorNode = ReactDOM.findDOMNode(editor)
      this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
      this._editorNode.addEventListener('dragleave', this.handleDragLeave)
    }

    componentWillUnmount() {
      this._editorNode.removeEventListener('dragover', this.handleDragOverOtherNode)
      this._editorNode.removeEventListener('dragleave', this.handleDragLeave)
    }

    componentWillUpdate(nextProps) {
      const {node} = this.props
      const selection = nextProps.state.selection
      if (selection !== this.props.state.selection) {
        const isFocused = selection.hasFocusIn(node)
        this.setState({isFocused: isFocused})
      }
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

    // Remove the drop target if we leave the editors nodes
    handleDragLeave = event => {
      event.stopPropagation()
      if (event.target === this._editorNode) {
        this._dropTarget = null
      }
    }


    handleDragOverOtherNode = event => {
      const targetDOMNode = event.target

      // As the event is registered on the editor parent node
      // ignore the event if it is coming from from the editor node itself
      if (targetDOMNode === this._editorNode) {
        return
      }

      const {state} = this.props
      const {document} = state

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

      const rangeOffset = range.startOffse
      const rangeLength = range.startContainer.wholeText
        ? range.startContainer.wholeText.rangeLength
        : 0
      const rangeIsAtStart = rangeOffset < rangeLength / 2
      const offsetKey = OffsetKey.findKey(targetDOMNode, 0)
      const {key} = offsetKey

      let node
      if (this._isInline) {
        node = document.getClosestBlock(key)
      } else {
        node = document.getClosestBlock(key)
      }

      if (!node) {
        this._dropTarget = null
        return
      }

      this._dropTarget = {node: node, isAtStart: rangeIsAtStart, offset: rangeOffset}
      // console.log(this._dropTarget)
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

    applyDropTargetInline(transform, target) {
      const {node} = this.props
      let next = transform
      if (target.isAtStart) {
        next = next.collapseToStartOf(target.node)
      } else {
        next = this.applyDropTargetBlock(next, target)
      }
      // Move cursor and apply
      next = next.collapseToEndOf(node)
        .focus()
        .apply()

      return next
        .moveToOffsets(target.offset)
        .insertInline(node)
    }

    applyDropTargetBlock(transform, target) {
      const {node} = this.props
      let next = transform
      if (target.isAtStart) {
        next = next.collapseToStartOf(target.node)
      } else {
        next = next.collapseToEndOf(target.node)
      }
      return next.insertBlock(node)
    }

    handleDragStart = event => {
      event.dataTransfer.effectAllowed = 'none'
      event.dataTransfer.setData('text/plain', '')
    }

    handleDragEnd = event => {
      const {editor, state, node} = this.props
      const target = this._dropTarget

      // Return if this is our node
      if (!target || target.node === node) {
        return
      }
      let next = state.transform().removeNodeByKey(node.key)
      if (this._isInline) {
        next = this.applyDropTargetInline(next, target)
      } else {
        next = this.applyDropTargetBlock(next, target)
      }

      // Move cursor and apply

      next = next.collapseToEndOf(node)
        .focus()
        .apply()

      editor.onChange(next)
      this._dropTarget = null
    }

    handleCancelEvent = event => {
      event.preventDefault()
    }

    getValue() {
      return this.props.node.data.get('value')
    }

    handleClose = () => {
      this.setState({isEditing: false})
    }

    renderPreview() {
      return (
        <ItemPreview
          type={ofField}
          value={this.getValue()}
        />
      )
    }

    renderInput() {
      return this.state.isEditing ? (
        <EditItemPopOver
          scrollContainerId={this.props.editor.props.formBuilderInputId}
          title={this.props.node.title}
          onClose={this.handleClose}
        >
          <ItemForm
            onDrop={this.handleCancelEvent}
            type={ofField}
            level={0}
            value={this.getValue()}
            onChange={this.handleChange}
          />
        </EditItemPopOver>
      ) : null
    }

    render() {
      let styles
      let NodeTag = 'div'
      if (ofField.options && ofField.options.inline) {
        styles = inlineStyles
        NodeTag = 'span'
      } else {
        styles = blockStyles
      }

      const className = this.state.isFocused ? styles.active : styles.root

      return (
        <NodeTag
          {...this.props.attributes}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          draggable
          className={className}
        >
          <span className={styles.previewContainer} onClick={this.handleToggleEdit}>
            {this.renderPreview()}
          </span>

          <div className={styles.inputContainer}>
            {this.renderInput()}
          </div>
        </NodeTag>
      )
    }
  }
}
