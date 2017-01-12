import React, {PropTypes} from 'react'
import {getFieldType} from '../schema/getFieldType'

export default class Preview extends React.Component {

  static propTypes = {
    style: PropTypes.string,
    value: PropTypes.object,
    field: PropTypes.object.isRequired
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  render() {
    const {field, value, style} = this.props

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(field)

    // hack: pick the field/type previewTypeDef that has a preview config
    const previewTypeDef = (field.options || {}).preview ? field : getFieldType(this.context.formBuilder.schema, field)

    if (PreviewComponent) {
      return <PreviewComponent field={previewTypeDef} value={value} style={style} />
    }
    return <div>No preview for {JSON.stringify(value)}</div>
  }
}
