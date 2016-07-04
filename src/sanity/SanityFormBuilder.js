// Connects the FormBuilder with various sanity roles

import React, {PropTypes} from 'react'
import client from 'client:@sanity/base/client'
import equals from 'shallow-equals'
import schema from 'schema:@sanity/base/schema'
import locationStore from 'datastore:@sanity/base/location'
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
    this.handleSave = this.handleSave.bind(this)
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
    const nextValue = this.state.value.patch(event.patch)
    this.setState({
      value: nextValue,
      validation: nextValue.validate()
    })
  }

  handleSave() {
    const data = this.state.value.serialize()
    const patch = Object.keys(data).reduce((doc, key) => {
      if (key[0] === '$') {
        return doc
      }

      doc[key] = data[key]
      return doc
    }, {})

    this.setState({saving: true})

    const prefixedType = `${schema.name}.${data.$type}`
    const mutation = data.$id
      ? client.update(data.$id, patch)
      : client.create(Object.assign({$type: prefixedType}, patch))

    mutation
      .then(res => {
        this.setState({saving: false, changed: false})

        const newId = res.docIds[0]
        if (newId !== data.$id) {
          // @todo figure out how to navigate to the correct URL
          locationStore.actions.navigate('/')
        }
      })
      .catch(err => {
        console.error(err) // eslint-disable-line no-console
        this.setState({saving: false})
      })
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
