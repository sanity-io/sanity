import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'
import FallbackPreviewComponent from '../Array/FallbackPreviewComponent'
import styles from './styles/BlockPreview.css'

export default class PreviewWrapper extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.any
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }

  getFieldType(type) {
    return getFieldType(this.context.formBuilder.schema, type)
  }


  render() {
    const {value, type} = this.props

    const fieldType = this.getFieldType(type)

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(type, fieldType)

    return (
      <div className={styles.root}>
        <PreviewComponent
          style="default"
          value={value.serialize()}
          type={fieldType}
          schema={this.context.formBuilder.schema}
        />
      </div>
    )
  }
}
