// Connects the FormBuilder with various sanity roles

import React, {PropTypes} from 'react'
import documentStore from 'datastore:@sanity/base/document'
import FormBuilder from './SanityFormBuilder'
import equals from 'shallow-equals'
import {unprefixType} from './utils/unprefixType'
import schema from 'schema:@sanity/base/schema'
import location from 'datastore:@sanity/base/location'

const preventDefault = ev => ev.preventDefault()

function createFormBuilderStateFrom(serialized, typeName) {
  return serialized ? FormBuilder.deserialize(unprefixType(serialized), typeName) : FormBuilder.createEmpty(typeName)
}

export default class SanityFormBuilder extends React.Component {
  static propTypes = {
    documentId: PropTypes.string,
    typeName: PropTypes.string
  };

  constructor(props, ...rest) {
    super(props, ...rest)

    this.state = {value: FormBuilder.createEmpty(props.typeName)}

    this.handleChange = this.handleChange.bind(this)
    this.handleDocPatch = this.handleDocPatch.bind(this)
    this.subscriptions = []
  }

  setupSubscriptions(props) {
    this.tearDownSubscriptions()
    const {documentId, typeName} = props

    const byId = documentStore.byId(documentId)

    this.setState({
      value: FormBuilder.createEmpty(typeName)
    })

    const initialSubscription = byId
      .first(event => event.type === 'snapshot')
      .subscribe(event => {
        this.setState({
          value: createFormBuilderStateFrom(event.document, typeName)
        })
      })

    const updateSubscription = byId
      .filter(event => event.type === 'update')
      .subscribe(event => {
        this.handleDocPatch(event.patch)
      })

    this.subscriptions = [initialSubscription, updateSubscription]
  }
  tearDownSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }
  componentWillMount() {
    this.setupSubscriptions(this.props)
  }
  componentWillUnmount() {
    this.tearDownSubscriptions()
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !equals(this.props, nextProps) || !equals(this.state, nextState)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setupSubscriptions(nextProps)
    }
  }

  handleChange(event) {

    const id = this.state.value.getFieldValue('$id')

    const op = id ? this.update(id, event.patch) : this.create(event.patch)

    op.subscribe(() => {
      console.log('Document saved…')
    })
  }
  update(id, patch) {
    return documentStore.update(id, patch)
  }
  create(patch) {
    if (this.creating) {
      return
    }
    const {typeName} = this.props
    const prefixedType = `${schema.name}.${typeName}`
    const nextValue = this.state.value.patch(patch)
    this.creating = true
    return documentStore
      .create(Object.assign(nextValue.serialize(), {$type: prefixedType}))
      .delay(1000) // Need to wait for document to actual exist in ES index
      .do(result => {
        // todo: fix this
        location.actions.navigate(document.location.pathname
          .split('/')
          .slice(0, -1)
          .concat(result.documentId)
          .join('/'))
      })
  }

  handleDocPatch(patch) {
    const nextValue = this.state.value.patch(patch)
    this.setState({value: nextValue})
  }

  render() {
    const {value, saving, validation} = this.state

    return (
      <div className="content">
        <form className="form-container" onSubmit={preventDefault}>
          <FormBuilder
            value={value}
            validation={validation}
            onChange={this.handleChange}
          />
        </form>

        <p>
          <button disabled={saving} onClick={this.handleSave}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </p>
      </div>
    )
  }
}
