import React, {PropTypes} from 'react'

import applySanityPatch from './applySanityPatch'
import DefaultButton from 'part:@sanity/components/buttons/default'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import ItemForm from './ItemForm'
import styles from './styles/LinkNode.css'

export default class LinkNode extends React.Component {
  static propTypes = {
    type: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object,
    children: PropTypes.node,
    node: PropTypes.object
  }

  state = {isFocused: false, isEditing: true, isManaging: false}

  componentWillUpdate(nextProps) {
    const {node} = this.props
    const selection = nextProps.state.selection
    if (selection !== this.props.state.selection) {
      const isFocused = selection.hasFocusIn(node)
      this.setState({isFocused: isFocused})
      if (!isFocused) {
        this.setState({isManaging: false, isEditing: false})
        return
      }
      if (this.hasValue() && !this.state.isEditing) {
        this.setState({isManaging: true, isEditing: false})
        return
      }
      this.setState({isManaging: false, isEditing: true})
    }
  }

  handleChange = event => {
    const {node, editor} = this.props
    const next = editor.getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {value: applySanityPatch(node.data.get('value'), event.patch)}
      })
      .apply()

    editor.onChange(next)
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
      this.handleRemoveLink()
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

  handleRemoveLink = () => {
    const {editor} = this.props
    const blockEditor = editor.props.blockEditor
    blockEditor.removeLink()
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  renderInput() {
    const {type} = this.props
    return (
      <EditItemPopOver
        onClose={this.handleCloseInput}
      >
        <ItemForm
          onDrop={this.handleCancelEvent}
          type={type}
          level={0}
          value={this.getValue()}
          onChange={this.handleChange}
        />
      </EditItemPopOver>
    )
  }

  renderManage() {
    const href = this.getValue().serialize().href
    return (
      <EditItemPopOver
        onClose={this.handleCloseManage}
      >
        <h3>Link</h3>
        <div className={styles.manageLinkPreview}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {href}
          </a>
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
            onClick={this.handleRemoveLink}
          >
            Remove
          </DefaultButton>
        </div>
      </EditItemPopOver>
    )
  }

  render() {
    const {isEditing, isManaging} = this.state
    const {attributes} = this.props
    return (
      <span
        {...attributes}
        className={styles.root}
      >
        {this.props.children}

        {isManaging && (
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
