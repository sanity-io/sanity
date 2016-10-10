import React from 'react'
import styles from './styles/SchemaForm.css'
import {bindAll} from 'lodash'
import Header from './Header'
import Inspector from './Inspector'
import {save, restore} from '../lib/persist'

import sourceSchemas from '../schemas'
import {createFormBuilder, Schema} from '../../../src'
import {parseParams, preventDefault} from '../lib/utils'

import MyCustomLatLonInput from './custom/MyCustomLatLonInput'
import MyCustomValidationList from './custom/MyCustomValidationList'
import MyCustomImageInput from './custom/MyCustomImageInput'
import MyCustomFileInput from './custom/MyCustomFileInput'
import BlockEditorSlate from '../../../src/inputs/BlockEditor-slate'
import SimpleImagePreview from './custom/SimpleImagePreview'
import resolveReferenceComponent from './custom/resolveReferenceComponent'

const SCHEMA_NAMES = Object.keys(sourceSchemas)
const params = parseParams(document.location.pathname)

const schema = params.schemaName && params.typeName && Schema.compile(sourceSchemas[params.schemaName])

const PERSISTKEY = `form-builder-value-${params.schemaName}-${params.typeName}`

const FormBuilder = schema && createFormBuilder({
  schema: schema,
  resolveInputComponent(field, fieldType) {
    if (field.component || fieldType.component) {
      return field.component || fieldType.component
    }
    if (field.type === 'latlon') {
      return MyCustomLatLonInput
    }
    if (field.type === 'array' && field.editor === 'slate') {
      return BlockEditorSlate
    }
    if (field.type === 'reference') {
      return resolveReferenceComponent(field)
    }
    if (field.type === 'image') {
      return MyCustomImageInput
    }
    if (field.type === 'file') {
      return MyCustomFileInput
    }
    return undefined // signal to use default
  },
  resolvePreviewComponent(field, fieldType) {
    if (field.type === 'simpleImage') {
      return SimpleImagePreview
    }
    return undefined // signal to use default
  },
  resolveValidationComponent() {
    return MyCustomValidationList
  }
})

export default class Main extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      inspect: false,
      value: FormBuilder.createEmpty(params.typeName),
      saved: false
    }
    bindAll(this, [
      'handleDispatchCommand',
      'handleChange',
      'CommandButton'
    ])
  }

  handleChange(event) {
    this.setState({
      value: this.state.value.patch(event.patch),
      saved: false
    })
  }

  cmdSave(event) {
    save(PERSISTKEY, this.state.value.serialize())
    this.setState({saved: true})
  }
  cmdLog(event) {
    console.log(this.state.value.serialize()) // eslint-disable-line no-console
  }
  cmdClear(event) {
    this.setState({value: FormBuilder.createEmpty(params.typeName)})
  }
  cmdRevert(event) {
    this.setState({value: FormBuilder.deserialize(restore(PERSISTKEY), params.typeName)})
  }
  cmdInspectLive(event) {
    this.setState({inspect: event.currentTarget.checked ? 'docked' : false})
  }
  handleDispatchCommand(event) {
    const command = event.currentTarget.getAttribute('data-cmd')
    const methodName = `cmd${command}`
    if ((typeof this[methodName]) !== 'function') {
      throw new Error(`Invalid command: ${JSON.stringify(command)}`)
    }
    this[methodName](event)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.inspect !== this.state.inspect) {
      document.body.style.overflow = this.state.inspect === 'fullscreen' ? 'hidden' : ''
    }
  }

  CommandButton(props) {
    return (
      <button
        type="button"
        className={styles.toolbarButton}
        data-cmd={props.command}
        onClick={this.handleDispatchCommand}
      >
        {props.children}
      </button>
    )
  }
  renderToolbar() {
    const {inspect, saved} = this.state
    return (
      <div className={styles.toolbar}>
        <this.CommandButton command="Save">{saved ? '✓ Saved' : '  Save'}</this.CommandButton>
        <this.CommandButton command="Revert">Load saved</this.CommandButton>
        <this.CommandButton command="Clear">Clear</this.CommandButton>
        <this.CommandButton command="Log">console.log value</this.CommandButton>
        {' '}
        <label>
          <input data-cmd="InspectLive" checked={inspect} type="checkbox" onChange={this.handleDispatchCommand} />
          {' '} Live inspection
        </label>
      </div>
    )
  }

  renderInspect() {
    const {value, inspect} = this.state
    return (
      <div className={styles[inspect === 'docked' ? 'inspectPane' : 'inspectPaneFullScreen']}>
        <button className={styles.closeInspectPaneButton} onClick={() => this.setState({inspect: false})}>x</button>
        {inspect === 'docked' && (
          <button className={styles.fullscreenInspectPaneButton} onClick={() => this.setState({inspect: 'fullscreen'})}>↑</button>
        )}
        {inspect === 'fullscreen' && (
          <button className={styles.dockedInspectPaneButton} onClick={() => this.setState({inspect: 'docked'})}>↓</button>
        )}
        <div className={styles[inspect === 'docked' ? 'inspectPaneInner' : 'inspectPaneInnerFullScreen']}>
          <Inspector inspect={value.serialize()} />
        </div>
      </div>
    )
  }

  render() {
    const {value, inspect, validation} = this.state
    return (
      <div className={styles.root}>
        <Header
          schemaNames={SCHEMA_NAMES}
          typeNames={schema && schema.getTypeNames()}
          selectedSchemaName={params.schemaName}
          selectedTypeName={params.typeName}
        />
        {this.renderToolbar()}
        <div className={styles.inner}>
          <form onSubmit={preventDefault}>
            <div>
              <FormBuilder
                value={value}
                validation={validation}
                onChange={this.handleChange}
              />
            </div>
          </form>
        </div>
        {inspect && this.renderInspect()}
      </div>
    )
  }
}
