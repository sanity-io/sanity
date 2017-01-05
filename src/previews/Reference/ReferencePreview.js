import React, {PropTypes} from 'react'
import Preview from '../../Preview'
import * as previewUtils from '../../../lib/sanity/preview/utils'

export default class ReferencePreview extends React.Component {

  static contextTypes = {
    formBuilder: PropTypes.object
  }
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

  materializeRefOfType(ref, refTypeName) {
    const {materializeReference} = this.props
    const schema = this.context.formBuilder.schema
    const refType = schema.getType(refTypeName)

    const previewConfig = previewUtils.canonicalizePreviewConfig(refType)

    return materializeReference(ref, previewConfig.fields)
  }
  materialize(value) {
    const {materializeReference, field} = this.props

    if (field.to.length > 1) {
      // Todo:We need to know the ref type *before* fetching in order to be able to build the fields
      // selection part of the query
      // THIS NEEDS TO BE FIXED. Possibly by storing the type in a `_refType` property on the reference entry itself
      return materializeReference(value._ref, ['_type'])
        .then(doc => this.materializeRefOfType(value._ref, doc._type))
    }
    return this.materializeRefOfType(value._ref, field.to[0].type)
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
