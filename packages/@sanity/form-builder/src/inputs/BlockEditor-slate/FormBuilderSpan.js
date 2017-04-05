import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'

import applySanityPatches from './applySanityPatches'
import DefaultButton from 'part:@sanity/components/buttons/default'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import Preview from '../../Preview'
import RenderField from '../Object/RenderField'
import styles from './styles/FormBuilderSpan.css'
import arrify from 'arrify'

export default class FormBuilderSpan extends React.Component {
  static propTypes = {
    type: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object,
    children: PropTypes.node,
    node: PropTypes.object
  }

  state = {isFocused: false, isEditing: false}
  _clickCounter = 0
  _isMarkingText = false
  _editorNodeRect = null

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.isEditing !== this.state.isEditing
      || nextState.rootElement !== this.state.rootElement
      || nextProps.state.focusOffset !== this.props.state.focusOffset
      || nextProps.node.data.get('value') !== this.props.node.data.get('value')
  }

  componentWillUpdate(nextProps, nextState) {
    const {node} = this.props
    const {state} = nextProps
    const selection = state.selection
    const isFocused = selection.hasFocusIn(node)

    if (selection !== this.props.state.selection) {
      if (!isFocused) {
        this.setState({isEditing: false, ...{isFocused}})
      }
    }
  }

  componentWillMount() {
    if (this.isEmpty()) {
      this.setState({isEditing: true})
    }
  }

  componentDidMount() {
    this._editorNodeRect = ReactDOM.findDOMNode(this.props.editor).getBoundingClientRect()
  }

  isEmpty() {
    const valueContainer = this.getValue()
    if (!valueContainer) {
      return true
    }
    return !valueContainer.value || valueContainer.isEmpty()
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  handleCloseInput = () => {
    if (this.isEmpty()) {
      this.handleRemove()
      return
    }
    // Let it happen after focus is set in the editor (state may be out of sync)
    this.props.editor.focus()
    setTimeout(() => {
      if (this.state.isEditing) {
        this.setState({isEditing: false})
      }
    }, 100)
  }

  handleRemove = () => {
    this.props.editor.props.blockEditor
      .operations
      .removeSpan(this.props.node)
  }

  // Open dialog when user clicks the node,
  // but support double clicks, and mark text as normal
  handleMouseDown = () => {
    this._isMarkingText = true
    setTimeout(() => {
      if (this._clickCounter === 1 && !this._isMarkingText) {
        this.setState({isEditing: true})
      }
      this._clickCounter = 0
    }, 350)
    this._clickCounter++
  }

  handleMouseUp = () => {
    this._isMarkingText = false
  }

  handleReset = () => {
    this.props.editor.props.blockEditor
      .operations
      .resetSpan(this.props.node)
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  handleFieldChange = (event, field) => {
    const {node, editor} = this.props
    const next = editor.getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {
          value: applySanityPatches(node.data.get('value'), event.prefixAll(field.name).patches)
        }
      })
      .apply()

    editor.onChange(next)
  }

  renderInput() {
    const value = this.getValue()
    const type = value.context.type
    const ignoredFields = ['text', 'marks']
    const memberFields = type.fields.filter(field => {
      return !ignoredFields.includes(field.name)
    })
    const style = {}
    if (this.state.rootElement) {
      const {width, height, left} = this.state.rootElement.getBoundingClientRect()
      style.width = `${width}px`
      style.height = `${height}px`
      style.left = `${left - this._editorNodeRect.left}px`
      style.top = `${this.state.rootElement.offsetTop + height + 10}px`
    }

    return (
      <span className={styles.editSpanContainer} style={style}>
        <EditItemPopOver
          onClose={this.handleCloseInput}
        >
          {
            this.renderManage()
          }

          {
            memberFields.map(eField => {
              const fieldValue = value.getAttribute(eField.name)
              return (
                <RenderField
                  key={eField.name}
                  field={eField}
                  level={0}
                  value={fieldValue}
                  onChange={this.handleFieldChange}
                />
              )
            })
          }
        </EditItemPopOver>
      </span>
    )
  }

  shouldPreview() {
    // Disabled for now
    return false
  }

  renderPreview() {
    if (this.shouldPreview()) {
      const value = this.getValue()
      return (
        <Preview
          value={value.serialize()}
          type={value.context.type}
        />
      )
    }
    return null
  }

  renderManage() {
    return (
      <div>
        <div className={styles.manageLinkPreview}>
          { this.renderPreview() }
        </div>
        <div className={styles.manageButtons}>
          <DefaultButton
            kind="simple"
            onClick={this.handleReset}
          >
            Reset
          </DefaultButton>
          <DefaultButton
            kind="simple"
            color="danger"
            onClick={this.handleRemove}
          >
            Remove
          </DefaultButton>
        </div>
      </div>
    )
  }

  setRootElement = element => {
    this.setState({rootElement: element})
  }

  render() {
    const {isEditing} = this.state
    const {attributes} = this.props
    return (
      <span
        {...attributes}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        className={styles.root}
        ref={this.setRootElement}
      >
        {this.props.children}

        { isEditing && this.renderInput() }

      </span>
    )
  }
}
