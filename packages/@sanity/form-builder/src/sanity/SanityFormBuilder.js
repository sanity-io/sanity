import schema from 'part:@sanity/base/schema'
import inputResolver from './inputResolver/inputResolver'
import SanityPreview from 'part:@sanity/base/preview'
import ValidationList from 'part:@sanity/form-builder/validation-list'
import arrify from 'arrify'
import toGradientPatch from './utils/toGradientPatch'
import React, {PropTypes} from 'react'

import {createFormBuilder, defaultConfig} from '../index'

const FormBuilder = createFormBuilder({
  schema: schema,
  resolveInputComponent: inputResolver,
  resolvePreviewComponent: () => SanityPreview,
  resolveValidationComponent: () => ValidationList
})

export {createFormBuilder, inputResolver, defaultConfig, toGradientPatch}

export default class SanityFormBuilder extends React.PureComponent {
  static createEmpty = FormBuilder.createEmpty;
  static deserialize = FormBuilder.deserialize;
  static propTypes = {
    onChange: PropTypes.func,
  }
  handleChange = event => {
    const {onChange} = this.props
    const arrified = arrify(event.patch)
    onChange({
      patches: arrified.map(toGradientPatch),
      _formBuilderPatches: arrified
    })
  }
  render() {
    return <FormBuilder {...this.props} onChange={this.handleChange} />
  }
}
