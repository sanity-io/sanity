import React, {PropTypes} from 'react'

import {pick} from 'lodash'
import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'
import guessPreviewConfig from './guessPreviewProps'

function prepareValue(value, previewConfig) {
  debugger
  // todo: validation
  if (!previewConfig || !previewConfig.fields) {
    return value
  }
  const properties = Array.isArray(previewConfig.fields) ? previewConfig.fields : Object.keys(previewConfig.fields)

  const valueWithProps = pick(value, properties)
  return typeof previewConfig.prepare === 'function' ? previewConfig.prepare(valueWithProps) : valueWithProps
}

const previewComponentMap = {
  default: PreviewComponentDefault,
  card: PreviewComponentCard,
  media: PreviewComponentMedia,
  detail: PreviewComponentDetail,
  inline: PreviewComponentInline
}

export default class DefaultPreview extends React.Component {

  static propTypes = {
    style: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    field: PropTypes.object.isRequired
  };

  render() {
    const {style, value, field} = this.props

    const PreviewComponent = previewComponentMap.hasOwnProperty(style)
      ? previewComponentMap[style]
      : previewComponentMap.default

    const previewConfig = (field.options && field.options.preview)
      ? field.options.preview
      : guessPreviewConfig(field, field)

    return <PreviewComponent item={prepareValue(value, previewConfig)} />
  }
}
