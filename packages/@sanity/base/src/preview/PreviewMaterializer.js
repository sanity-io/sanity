import React, {PropTypes} from 'react'
import materializeForPreview from './materializeForPreview'

export default class PreviewMaterializer extends React.PureComponent {
  static propTypes = {
    value: PropTypes.any.isRequired,
    type: PropTypes.shape({
      preview: PropTypes.shape({
        fields: PropTypes.object.isRequired,
        prepare: PropTypes.func
      }).isRequired
    }),
    children: PropTypes.func
  };

  state = {
    loading: false,
    error: null,
    result: null
  }

  componentWillMount() {
    const {type, value} = this.props
    this.materialize(value, type)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.materialize(nextProps.value, nextProps.type)
    }
  }

  materialize(value, type) {
    materializeForPreview(value, type)
      .then(res => {
        this.setState({result: res})
      })
  }

  render() {
    const {result, loading, error} = this.state
    if (loading) {
      return <div>Loading…</div>
    }
    if (error) {
      return <div>Error: {error.message}</div>
    }
    if (!result) {
      return <div />
    }
    return this.props.children(result)
  }
}
