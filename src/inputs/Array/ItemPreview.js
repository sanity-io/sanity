import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'
import styles from './styles/ItemPreview.css'
import Preview from '../../Preview'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'

export default class ItemPreview extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleEdit = this.handleEdit.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
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
    const {value, onEdit} = this.props
    onEdit(value)
  }

  toggleEdit() {
    // Handle toggle insted of edit
  }

  handleRemove(event) {
    event.stopPropagation()
    event.preventDefault()
    const {value, onRemove} = this.props
    onRemove(value)
  }
  handleMouseDown(event) {
    event.stopPropagation()
  }

  getFieldType(field) {
    return getFieldType(this.context.formBuilder.schema, field)
  }

  render() {
    const {value, field} = this.props
    return (
      <div className={styles.root} onClick={this.handleEdit}>
        <div className={styles.functions}>
          <Button
            kind="simple"
            color="danger"
            icon={TrashIcon}
            title="Delete"
            onClick={this.handleRemove}
            onMouseDown={this.handleMouseDown}
          />
        </div>
        <div className={styles.content}>
          <Preview style="default" value={value.serialize()} field={field} />
        </div>
      </div>
    )
  }
}
