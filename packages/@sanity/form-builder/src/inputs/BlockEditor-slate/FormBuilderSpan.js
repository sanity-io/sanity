import React, {PropTypes} from 'react'

import applySanityPatch from './applySanityPatch'
import DefaultButton from 'part:@sanity/components/buttons/default'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import Preview from '../../Preview'
import ItemForm from './ItemForm'
import styles from './styles/LinkNode.css'

export default class FormBuilderSpan extends React.Component {
  static propTypes = {
    type: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object,
    children: PropTypes.node,
    node: PropTypes.object
  }

  state = {isFocused: false, isEditing: false, isManaging: false}

  componentWillUpdate(nextProps) {
    const {node} = this.props
    const {isEditing} = this.state
    const selection = nextProps.state.selection
    const isFocused = selection.hasFocusIn(node)

    if (selection !== this.props.state.selection) {
      this.setState({isFocused: isFocused})
      if (!isFocused) {
        this.setState({isManaging: false, isEditing: false})
        return
      }
      if (isFocused && this.hasValue() && !isEditing) {
        this.setState({isManaging: true, isEditing: false})
      }
    }
  }

  hasValue() {
    return this.getValue().serialize()
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  handleToggle = () => {
    if (this.getValue()) {
      this.setState({isEditing: true})
      return
    }
    this.setState({isManaging: true})
  }

  handleCloseInput = () => {
    if (!this.getValue().serialize()) {
      this.handleRemove()
      return
    }
    this.setState({isEditing: false})
  }

  handleCloseManage = () => {
    this.setState({isManaging: false})
  }

  handleSwitchToEdit = () => {
    this.setState({isManaging: false, isEditing: true})
  }

  handleRemove = () => {
    this.props.editor.props.blockEditor.operations.removeSpan()
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  handleChange = event => {
    const {node, editor} = this.props
    const next = editor.getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {
          value: applySanityPatch(node.data.get('value'), event.patch)
        }
      })
      .apply()

    editor.onChange(next)
  }

  renderInput() {
    const value = this.getValue()
    const editType = value.context.type
    return (
      <EditItemPopOver
        onClose={this.handleCloseInput}
      >
        <ItemForm
          onDrop={this.handleCancelEvent}
          type={editType}
          level={0}
          value={value}
          onChange={this.handleChange}
        />
      </EditItemPopOver>
    )
  }

  renderManage() {
    const value = this.getValue()

    return (
      <EditItemPopOver
        onClose={this.handleCloseManage}
      >
        <div className={styles.manageLinkPreview}>
          <Preview
            value={value.serialize()}
            type={value.context.type}
          />
        </div>
        <div className={styles.manageButtons}>
          <DefaultButton
            kind="simple"
            color="primary"
            onClick={this.handleSwitchToEdit}
          >
            Change
          </DefaultButton>
          <DefaultButton
            kind="simple"
            color="danger"
            onClick={this.handleRemove}
          >
            Remove
          </DefaultButton>
        </div>
      </EditItemPopOver>
    )
  }
  render() {
    const {isEditing, isManaging, isFocused} = this.state
    const {attributes} = this.props
    return (
      <span
        {...attributes}
        className={styles.root}
      >
        {this.props.children}

        {isManaging && isFocused && (
          <span className={styles.editBlockContainer}>
            {this.renderManage()}
          </span>
        )}

        {isEditing && (
          <span className={styles.editBlockContainer}>
            {this.renderInput()}
          </span>
        )}

      </span>
    )
  }
}
