import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'
import Preview from '../../previews/Preview'


export default class ItemPreview extends React.Component {

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

    return (
      <Preview
        style="default"
        value={value.serialize()}
        type={type}
      />
    )
  }
}
