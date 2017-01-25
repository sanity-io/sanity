import createSelector from '../../previews/createSelector'
import React, {PropTypes} from 'react'

const select = createSelector((id, fields) => {
  console.log('fetch doc with id %s', id, fields)
  return Promise.resolve()
})

const pass = v => v

export default class PreviewMaterializer extends React.PureComponent {

  static propTypes = {
    value: PropTypes.any.isRequired,
    config: PropTypes.shape({
      fields: PropTypes.object.isRequired,
      prepare: PropTypes.func
    }).isRequired,
    children: PropTypes.func
  };

  state = {
    loading: false,
    error: null,
    result: null
  }

  componentWillMount() {
    this.materialize(this.props.value, this.props.config)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.materialize(nextProps.value, nextProps.config)
    }
  }

  materialize(value, config) {
    select(value, config.fields)
      .then(res => {
        this.setState({result: res})
      })
  }
  render() {
    const {result, loading, error} = this.state
    const {config} = this.props
    if (loading) {
      return <div>Loading…</div>
    }
    if (error) {
      return <div>Error: {error.message}</div>
    }
    if (!result) {
      return <div />
    }
    const prepare = config.prepare || pass
    return this.props.children(prepare(result))
  }
}
