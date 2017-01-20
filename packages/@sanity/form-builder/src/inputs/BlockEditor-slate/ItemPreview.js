import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'
import Preview from '../../previews/Preview'


export default class ItemPreview extends React.Component {

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

    return (
      <Preview
        style="default"
        value={value.serialize()}
        field={field}
      />
    )
  }
}
