import React, {PropTypes} from 'react'

export default class Preview extends React.Component {

  static propTypes = {
    style: PropTypes.string,
    value: PropTypes.object.isRequired,
    field: PropTypes.object.isRequired
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  render() {

    const {field, value, style} = this.props

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(field)

    if (PreviewComponent) {
      return <PreviewComponent field={field} value={value} style={style} />
    }
    return <div>No preview for {JSON.stringify(value)}</div>
  }
}
