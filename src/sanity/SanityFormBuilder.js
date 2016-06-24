import client from 'client:@sanity/base/client'
import equals from 'shallow-equals'
import React, {PropTypes} from 'react'

import {
  FormBuilder,
  FormBuilderProvider,
  createFormBuilderState
} from 'role:@sanity/form-builder'

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
    return {
      value: createFormBuilderState(props.initialValue, {
        type: props.type,
        schema: props.schema,
        resolveInputComponent: props.resolveInputComponent
      }),
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
    client.update(this.props.initialValue.$id, patch)
      .then(() => this.setState({saving: false, changed: false}))
      .catch(err => {
        console.error(err)
        this.setState({saving: false})
      })
  }

  render() {
    const {value, saving, validation} = this.state
    const {
      type,
      resolveInputComponent,
      resolveFieldComponent,
      resolveValidationComponent
    } = this.props

    return (
      <div className="content">
        <form className="form-container" onSubmit={preventDefault}>
          <FormBuilderProvider
            resolveInputComponent={resolveInputComponent}
            resolveFieldComponent={resolveFieldComponent}
            resolveValidationComponent={resolveValidationComponent}
            resolvePreviewComponent={() => {}}
            schema={this.props.schema}
          >
            <FormBuilder
              type={type}
              value={value}
              validation={validation}
              onChange={this.handleChange}
            />
          </FormBuilderProvider>
        </form>

        <p>
          <button disabled={saving} onClick={() => this.handleSave()}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </p>
      </div>
    )
  }
}

SanityFormBuilder.propTypes = {
  initialValue: PropTypes.object,
  schema: PropTypes.object,
  type: PropTypes.object.isRequired,
  resolveInputComponent: PropTypes.func.isRequired,
  resolveFieldComponent: PropTypes.func.isRequired,
  resolveValidationComponent: PropTypes.func.isRequired
}

export default SanityFormBuilder
