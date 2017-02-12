import React, {PropTypes} from 'react'
import observeForPreview from './observeForPreview'
import shallowEquals from 'shallow-equals'

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

  componentWillUnmount() {
    this.unsubscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  materialize(value, type) {
    // this.unsubscribe()
    this.subscription = observeForPreview(value, type)
      .subscribe(res => {
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
