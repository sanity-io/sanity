import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'
import styles from './styles/ItemPreview.css'
import Preview from '../../Preview'

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
    formBuilder: PropTypes.object
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }

  handleEdit() {
    const {index, onEdit} = this.props
    onEdit(index)
  }

  toggleEdit() {
    // Handle toggle insted of edit
  }

  handleRemove() {
    const {index, onRemove} = this.props
    onRemove(index)
  }

  getFieldType(field) {
    return getFieldType(this.context.formBuilder.schema, field)
  }

  render() {
    const {value, field} = this.props
    return (
      <div className={styles.root} onClick={this.handleEdit}>
        <Preview
          style="default"
          value={value.serialize()}
          field={field}
        />
      </div>
    )
  }
}
