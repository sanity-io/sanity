import React, {PropTypes} from 'react'
import Preview from '../../previews/Preview'

export default class ReferencePreview extends React.Component {

  static contextTypes = {
    formBuilder: PropTypes.object
  }
  static propTypes = {
    materializeReference: PropTypes.func.isRequired,
    type: PropTypes.object.isRequired,
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
    this.setMaterializedFrom(this.props.value)
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.setMaterializedFrom(nextProps.value)
    }
  }

  setMaterializedFrom(value) {
    this.setState({loading: true})
    this.materialize(value)
      .then(doc => this.setState({materialized: doc, loading: false}))
  }

  materializeRefOfType(ref, type) {
    const {materializeReference} = this.props
    return materializeReference(ref, type.options.preview.fields)
  }
  materialize(value) {
    const {materializeReference, type} = this.props

    if (type.to.length > 1) {
      // Todo: We need to know the ref type *before* fetching in order to
      // be able to build the selection part of the query
      // THIS NEEDS TO BE FIXED. Possibly by storing the type in a `_refType` property on the reference entry itself
      return materializeReference(value._ref, ['_type'])
        .then(doc => doc._type)
        .then(typeName => {
          const ofType = type.of.find(memberType => memberType.name === typeName)
          return this.materializeRefOfType(value._ref, ofType)
        })
    }
    return this.materializeRefOfType(value._ref, type.to[0])
  }

  render() {
    const {materialized, loading} = this.state
    const {value, style, type} = this.props
    if (!value._ref) {
      return <div />
    }
    if (loading) {
      return <div>Loading…</div>
    }

    const refType = type.to.find(toType => toType.type.name === materialized._type)
    return (
      <Preview
        style={style}
        value={materialized}
        type={refType}
      />
    )
  }
}
