import schema from 'part:@sanity/base/schema'
import inputResolver from 'part:@sanity/form-builder/input-resolver'
import previewResolver from 'part:@sanity/base/preview-resolver'
import ValidationList from 'part:@sanity/form-builder/validation-list'
import * as _previewUtils from './preview/utils'
import arrify from 'arrify'
import toGradientPatch from './utils/toGradientPatch'
import React, {PropTypes} from 'react'

import {createFormBuilder} from '../index'


export const previewUtils = _previewUtils // must be a better way, no?

const FormBuilder = createFormBuilder({
  schema: schema,
  resolveInputComponent: inputResolver,
  resolvePreviewComponent: previewResolver,
  resolveValidationComponent: () => ValidationList
})

export default class SanityFormBuilder extends React.PureComponent {
  static createEmpty = FormBuilder.createEmpty;
  static deserialize = FormBuilder.deserialize;
  static propTypes = {
    onChange: PropTypes.func
  }
  handleChange = event => {
    const {onChange} = this.props
    const patches = arrify(event.patch).map(toGradientPatch)
    onChange({patches: patches})
  }
  render() {
    return <FormBuilder {...this.props} onChange={this.handleChange} />
  }
}
