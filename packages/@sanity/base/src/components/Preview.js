import React, {PropTypes} from 'react'
import resolvePreview from 'part:@sanity/base/preview-resolver'

export default class Preview extends React.Component {
  static propTypes = {
    style: PropTypes.string,
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  };

  render() {

    const {type, value, style} = this.props

    const PreviewComponent = resolvePreview(type)

    if (!PreviewComponent) {
      return <div>No preview for {JSON.stringify(value)}</div>
    }
    return <PreviewComponent type={type} value={value} style={style} />
  }
}
