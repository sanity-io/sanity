import React, {PropTypes} from 'react'

import applySanityPatch from './applySanityPatch'
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

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.isEditing !== this.state.isEditing
      || nextState.isFocused !== this.state.isFocused
      || nextProps.state.selection !== this.props.state.selection
      || nextProps.node.data !== this.props.node.data
  }

  componentWillUpdate(nextProps, nextState) {
    const {node} = this.props
    const {state} = nextProps
    const selection = state.selection
    const isFocused = selection.hasFocusIn(node)
    const rest = {isFocused}

    if (selection !== this.props.state.selection) {
      if (!isFocused) {
        this.setState({isEditing: false, ...rest})
      }
    }
  }

  componentWillMount() {
    if (this.getValue()) {
      this.setState({isEditing: true})
    }
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  handleCloseInput = () => {
    // Let it happen after focus is set in the editor
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

  handleNodeClick = () => {
    this.setState({isEditing: true})
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
    const fieldPatch = arrify(event.patch).map(patch => Object.assign({}, patch, {
      path: [field.name, ...(patch.path || [])]
    }))
    const next = editor.getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {
          value: applySanityPatch(node.data.get('value'), fieldPatch)
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
    return (
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
    )
  }

  shouldPreview() {
    // Disabled for now
    return true
  }

  renderPreview() {
    const value = this.getValue()
    if (!value) {
      return null
    }
    if (this.shouldPreview()) {
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

  render() {
    const {isEditing} = this.state
    const {attributes} = this.props
    return (
      <span
        {...attributes}
        onMouseUp={this.handleNodeClick}
        className={styles.root}
      >
        {this.props.children}

        {isEditing && (
          <span className={styles.editBlockContainer}>
            {this.renderInput()}
          </span>
        )}

      </span>
    )
  }
}
