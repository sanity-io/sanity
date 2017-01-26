import React, {PropTypes} from 'react'

export default class Preview extends React.Component {

  static propTypes = {
    style: PropTypes.string,
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  render() {
    const {type, value, style} = this.props

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(type)

    if (PreviewComponent) {
      return <PreviewComponent type={type} value={value} style={style} />
    }
    return <div>No preview for {JSON.stringify(value)}</div>
  }
}
