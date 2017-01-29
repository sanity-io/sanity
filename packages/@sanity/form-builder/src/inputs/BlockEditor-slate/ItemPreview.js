import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import Preview from '../../Preview'


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

  render() {
    const {value, type} = this.props

    return (
      <Preview
        view="default"
        value={value.serialize()}
        type={type}
      />
    )
  }
}
