// Connects the FormBuilder with various sanity roles

import React, {PropTypes} from 'react'
import documentStore from 'datastore:@sanity/base/document'
import equals from 'shallow-equals'
import schema from 'schema:@sanity/base/schema'
import inputResolver from 'function:@sanity/form-builder/input-resolver'
import ValidationList from 'component:@sanity/form-builder/validation-list'
import {unprefixType} from './utils/unprefixType'

import {
  createFormBuilder,
  Schema
} from 'role:@sanity/form-builder'

const compiledSchema = Schema.compile(schema)

const FormBuilder = createFormBuilder({
  schema: compiledSchema,
  resolveInputComponent: inputResolver,
  resolveValidationComponent: () => ValidationList
})

const preventDefault = ev => ev.preventDefault()

class SanityFormBuilder extends React.Component {
  constructor(props) {
    super(props)

    this.state = this.getStateForProps(props)

    this.handleChange = this.handleChange.bind(this)
    this.handleDocPatch = this.handleDocPatch.bind(this)
  }

  componentWillMount() {
    documentStore.actions.update.calls.subscribe(call => {
      const [id, patch] = call.args
      if (id === this.props.documentId) {
        this.handleDocPatch(patch)
      }
    })
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !equals(this.props, nextProps) || !equals(this.state, nextState)
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateForProps(nextProps))
  }

  getStateForProps(props) {
    const value = props.initialValue
      ? FormBuilder.deserialize(unprefixType(props.initialValue))
      : FormBuilder.createEmpty(this.props.typeName)

    return {
      value: value,
      changed: false,
      saving: false
    }
  }

  handleChange(event) {
    const {typeName} = this.props
    const id = this.state.value.getFieldValue('$id')
    const prefixedType = `${schema.name}.${typeName}`
    const mutation = id
      ? documentStore.actions.update(id, event.patch)
      : documentStore.actions.create(Object.assign({$type: prefixedType}, event.patch))

    mutation.progress.subscribe(() => {})
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

SanityFormBuilder.propTypes = {
  initialValue: PropTypes.object,
  typeName: PropTypes.string
}

export default SanityFormBuilder
