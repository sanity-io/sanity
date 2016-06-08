import React, {PropTypes} from 'react'
import JSONView from './JSONView'

import {createFormBuilderState} from '../../../src/state/FormBuilderState'

import styles from './styles/Demo.css'

import {
  FormBuilder,
  FormBuilderProvider
} from '../../../src'

const DEBUG_JSON_STYLE = {
  zIndex: 10000,
  overflow: 'scroll',
  padding: 50,
  backgroundColor: 'white',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
}

function preventDefault(e) {
  e.preventDefault()
}

function restore(schema, type) {
  try {
    return JSON.parse(localStorage.getItem(`form-builder-demo-${schema.name}-${type.name}`))
  } catch (error) {
    console.log('Error reading from local storage: ', error)
  }
}

function save(schema, type, editorValue) {
  localStorage.setItem(`form-builder-demo-${schema.name}-${type.name}`, JSON.stringify(editorValue))
}

export default class Demo extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    const {schema, type, resolveInputComponent} = props
    const resolveContainer = (field, fieldType) => {
      const input = resolveInputComponent(field, fieldType)
      return input.valueContainer
    }
    const value = restore(schema, type) || void 0

    this.state = {
      value: createFormBuilderState(value, {
        type: type,
        schema: schema,
        resolveContainer
      }),
      saved: false,
      shouldInspect: false
    }
  }

  static propTypes = {
    schema: PropTypes.object.isRequired,
    resolveInputComponent: PropTypes.func.isRequired,
    resolveFieldComponent: PropTypes.func.isRequired,
    type: PropTypes.object.isRequired
  };

  handleChange(event) {
    const {value} = this.state
    const nextValue = value.patch(event.patch)
    // const validation = nextValue.validate()
    this.setState({
      shouldInspect: false,
      saved: false,
      value: nextValue,
      // validation: validation
    })
  }

  clear() {
    const {schema, type, resolveInputComponent} = this.props
    const newValue = createFormBuilderState(void 0, {
      type: type,
      schema: schema,
      resolveInputComponent
    })
    this.setState({value: newValue})
  }

  save() {
    const {value} = this.state
    const {schema, type} = this.props
    save(schema, type, value.unwrap())
    this.setState({saved: true})
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.shouldInspect !== this.state.shouldInspect) {
      document.body.style.overflow = this.state.shouldInspect ? 'hidden' : ''
    }
  }

  render() {
    const {value, saved, shouldInspect} = this.state
    const {schema, type, resolveInputComponent, resolveFieldComponent} = this.props

    if (shouldInspect) {
      console.log('CURRENT VALUE', value) // eslint-disable-line no-console
    }

    return (
      <div className={styles.root}>
        <button onClick={() => this.save()}>{saved ? 'Saved' : 'Save'} to local storage</button>
        <button onClick={() => this.clear()}>Clear value</button>
        {!shouldInspect && <button onClick={() => this.setState({shouldInspect: true})}>Inspect</button>}
        {shouldInspect && (
          <div style={DEBUG_JSON_STYLE}>
            <button onClick={() => this.setState({shouldInspect: false})}>Close</button>
            <h3>The serialized value:</h3>
            <JSONView json={value.serialize()} />
            <p>Check the console for the internal representation of the form builder value(s)</p>
          </div>
        )}

        <form className="form-container" onSubmit={preventDefault}>
          <h2>Generated form</h2>

          <FormBuilderProvider
            resolveInputComponent={resolveInputComponent}
            resolveFieldComponent={resolveFieldComponent}
            schema={schema}
          >
            <FormBuilder
              type={type}
              value={value}
              onChange={this.handleChange}
            />

          </FormBuilderProvider>
        </form>

        <h2>Parsed type</h2>
        <pre>{JSON.stringify(type, null, 2)}</pre>
      </div>
    )
  }
}
