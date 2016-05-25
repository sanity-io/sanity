import React, {PropTypes} from 'react'
import client from 'client:@sanity/base/client'
import equals from 'shallow-equals'

import {
  FormBuilder,
  FormBuilderProvider,
  createFormBuilderState
} from '@sanity/form-builder'

function preventDefault(ev) {
  ev.preventDefault()
}

class EditorBuilder extends React.Component {
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
    const resolveContainer = (field, fieldType) =>
      props.resolveFieldInput(field, fieldType).valueContainer

    return {
      value: createFormBuilderState(props.initialValue, {
        type: props.type,
        schema: props.schema,
        resolveContainer: resolveContainer
      }),
      changed: false,
      saving: false
    }
  }

  handleChange(event) {
    this.setState({
      changed: true,
      value: this.state.value.patch(event.patch)
    })
  }

  handleSave() {
    const data = this.state.value.unwrap()
    const newDocument = Object.keys(data).reduce((doc, key) => {
      if (key[0] === '$') {
        return doc
      }

      doc[key] = data[key]
      return doc
    }, {})

    const patch = {
      set: {
        attributes: newDocument
      }
    }

    this.setState({saving: true})
    client.update(this.props.initialValue.$id, patch)
      .then(() => {
        this.setState({saving: false, changed: false})
      })
      .catch(err => {
        console.error(err)
        this.setState({saving: false})
      })
  }

  render() {
    const {value, saving} = this.state
    const {schema, type, resolveFieldInput} = this.props

    return (
      <div className="content">
        <form className="form-container" onSubmit={preventDefault}>
          <FormBuilderProvider
            resolveFieldInput={resolveFieldInput}
            schema={schema}
          >
            <FormBuilder
              type={type}
              value={value}
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

EditorBuilder.propTypes = {
  initialValue: PropTypes.object,
  schema: PropTypes.object.isRequired,
  resolveFieldInput: PropTypes.func.isRequired,
  type: PropTypes.object.isRequired
}

export default EditorBuilder
