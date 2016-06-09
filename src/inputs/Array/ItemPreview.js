import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../utils/getFieldType'
import {capitalize} from 'lodash'
import Button from '../../buttons/Default'
import FallbackPreviewComponent from './FallbackPreviewComponent'

export default class ItemPreview extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleEdit = this.handleEdit.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    index: PropTypes.number.isRequired,
    value: PropTypes.any,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    resolvePreviewComponent: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }

  handleEdit() {
    const {index, onEdit} = this.props
    onEdit(index)
  }

  handleRemove() {
    const {index, onRemove} = this.props
    onRemove(index)
  }

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  }

  renderButtons() {
    return (
      <div>
        <Button
          type="button"
          title="Edit"
          onClick={this.handleEdit}
        >
          Edit
        </Button>
        <Button
          type="button"
          title="Delete"
          onClick={this.handleRemove}
        >
          Remove
        </Button>
      </div>
    )
  }

  render() {
    const {value, field} = this.props

    const fieldType = this.getFieldType(field)

    const PreviewComponent = this.context.resolvePreviewComponent(field, fieldType) || FallbackPreviewComponent

    const passSerialized = value.constructor.passSerialized

    return (
      <div>
        {this.renderButtons()}
        <h3>{capitalize(field.title || fieldType.title || fieldType.name)}:</h3>
        <PreviewComponent
          value={passSerialized ? value.serialize() : value}
          field={field}
          type={fieldType}
        />
      </div>
    )
  }
}
