import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'
import FallbackPreviewComponent from '../Array/FallbackPreviewComponent'
import styles from './styles/BlockPreview.css'

export default class PreviewWrapper extends React.Component {
  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.any
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }

  getFieldType(field) {
    return getFieldType(this.context.formBuilder.schema, field)
  }


  render() {
    const {value, field} = this.props

    const fieldType = this.getFieldType(field)

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(field, fieldType) || FallbackPreviewComponent

    const passSerialized = value.constructor.passSerialized

    return (
      <div className={styles.root}>
        <PreviewComponent
          value={passSerialized ? value.serialize() : value}
          field={field}
          type={fieldType}
        />
        (click to edit)
      </div>
    )
  }
}
