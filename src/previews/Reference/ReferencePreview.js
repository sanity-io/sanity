import React, {PropTypes} from 'react'
import Preview from '../../Preview'

export default class ReferencePreview extends React.Component {

  static propTypes = {
    materializeReference: PropTypes.func.isRequired,
    field: PropTypes.object.isRequired,
    value: PropTypes.shape({
      _ref: PropTypes.string
    }).isRequired,
    style: PropTypes.string,
  };

  state = {
    loading: true,
    materialized: null
  }

  componentWillMount() {
    this.materialize(this.props.value)
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.materialize(nextProps.value)
    }
  }

  materialize(value) {
    const {materializeReference} = this.props
    if (value && value._ref) {
      materializeReference(value._ref)
        .then(materialized => {
          this.setState({materialized: materialized, loading: false})
        })
    }
  }

  render() {
    const {materialized, loading} = this.state
    const {value, style, field} = this.props
    if (!value._ref) {
      return <div />
    }
    if (loading) {
      return <div>Loading…</div>
    }
    const refField = field.to.find(toField => toField.type === materialized._type)
    return (
      <Preview
        style={style}
        value={materialized}
        field={refField}
      />
    )
  }
}
