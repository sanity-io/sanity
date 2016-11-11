import React, {PropTypes} from 'react'
import resolvePreview from 'part:@sanity/base/preview-resolver'

export default class Preview extends React.Component {
  static propTypes = {
    style: PropTypes.string,
    value: PropTypes.object,
    typeDef: PropTypes.object
  };

  render() {

    const {typeDef, value, style} = this.props

    const PreviewComponent = resolvePreview(typeDef)

    if (PreviewComponent) {
      return <PreviewComponent field={typeDef} value={value} style={style} />
    }
    return <div>No preview for {JSON.stringify(value)}</div>
  }
}
