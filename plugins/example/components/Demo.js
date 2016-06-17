import React, {PropTypes} from 'react'
import JSONView from './JSONView'

import {createFormBuilderState} from '../../../src/state/FormBuilderState'

import styles from './styles/Demo.css'
import FormBuilderPropTypes from '../../../src/FormBuilderPropTypes'

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
    const val = localStorage.getItem(`form-builder-demo-${schema.name}-${type.name}`)
    return val ? JSON.parse(val) : undefined
  } catch (error) {
    console.log('Error reading from local storage: ', error)
  }
  return undefined
}

function save(schema, type, editorValue) {
  localStorage.setItem(`form-builder-demo-${schema.name}-${type.name}`, JSON.stringify(editorValue))
}

export default class Demo extends React.Component {

  static propTypes = {
    schema: FormBuilderPropTypes.schema,
    resolveInputComponent: PropTypes.func.isRequired,
    resolveFieldComponent: PropTypes.func.isRequired,
    resolveValidationComponent: PropTypes.func.isRequired,
    type: PropTypes.object.isRequired
  };

  handleChange(event) {
    const {value} = this.state
    const nextValue = value.patch(event.patch)
    const validation = nextValue.validate()
    this.setState({
      shouldInspect: false,
      saved: false,
      value: nextValue,
      validation: validation
    })
  }

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)

    this.state = {
      value: this.reload(),
      saved: false,
      shouldInspect: false
    }
  }

  createFormBuilderStateFrom(serialized) {
    const {schema, type, resolveInputComponent} = this.props
    return createFormBuilderState(serialized, {
      type: type,
      schema: schema,
      resolveInputComponent
    })
  }

  reload() {
    const {schema, type} = this.props
    return this.createFormBuilderStateFrom(restore(schema, type))
  }

  clear() {
    this.setState({value: this.createFormBuilderStateFrom(undefined)})
  }

  revert() {
    this.setState({value: this.reload()})
  }

  save() {
    const {value} = this.state
    const {schema, type} = this.props
    save(schema, type, value.serialize())
    this.setState({saved: true})
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.shouldInspect !== this.state.shouldInspect) {
      document.body.style.overflow = this.state.shouldInspect ? 'hidden' : ''
    }
  }

  render() {
    const {value, saved, validation, shouldInspect} = this.state
    const {schema, type, resolveInputComponent, resolveFieldComponent, resolveValidationComponent} = this.props

    if (shouldInspect) {
      console.log('CURRENT VALUE', value) // eslint-disable-line no-console
    }

    return (
      <div className={styles.root}>
        <button onClick={() => this.save()}>{saved ? 'Saved' : 'Save'} to local storage</button>
        <button onClick={() => this.clear()}>Clear value</button>
        <button onClick={() => this.revert()}>Revert local changes</button>
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
            resolvePreviewComponent={() => {}}
            resolveValidationComponent={resolveValidationComponent}
            schema={schema}
          >
            <FormBuilder
              type={type}
              value={value}
              validation={validation}
              onChange={this.handleChange}
            />

          </FormBuilderProvider>
        </form>

        <h2>Parsed type</h2>
        <pre>{JSON.stringify(type, null, 2)}</pre>

        <h2>Validation</h2>
        <pre>{JSON.stringify(validation, null, 2)}</pre>
      </div>
    )
  }
}
