// @flow
import React from 'react'
import styles from './styles/SchemaForm.css'
import Header from './Header'
import Inspector from './Inspector'
import {save, restore} from '../lib/persist'

import sourceSchemas from '../schemas'
import Schema from '@sanity/schema'
import {FormBuilder} from '../../../src'
import {parseParams, preventDefault} from '../lib/utils'

import MyCustomLatLonInput from './custom/MyCustomLatLonInput'
import MyCustomValidationList from './custom/MyCustomValidationList'
import MyCustomImageInput from './custom/MyCustomImageInput'
import MyCustomFileInput from './custom/MyCustomFileInput'
import MyCustomSlugInput from './custom/MyCustomSlugInput'
import applyPatch from '../../../src/simplePatch'
import resolveReferenceInput from './custom/resolveReferenceInput'
import {arrayToJSONMatchPath} from '@sanity/mutator'
import InputWithCustomState from './custom/InputWithCustomState'
import {set, unset} from '../../../src/utils/patches'
import {resolvePreviewComponent} from '../../../src/defaultConfig'

const SCHEMA_NAMES = Object.keys(sourceSchemas)
const params = parseParams(document.location.pathname)

const schema =
  params.schemaName && params.typeName && Schema.compile(sourceSchemas[params.schemaName])

const PERSISTKEY = `form-builder-value-${params.schemaName}-${params.typeName}`

const schemaType = schema && schema.get(params.typeName)

function logPatch(patch) {
  const {type, path, ...rest} = patch
  console.log(
    // eslint-disable-line no-console
    '%c%s%c %s =>',
    'color:#2097ac',
    type,
    'color:inherit',
    arrayToJSONMatchPath(path || []),
    rest
  )
}

function resolveInputComponent(type) {
  if (type.component) {
    return type.component
  }
  if (type.name === 'latlon') {
    return MyCustomLatLonInput
  }
  if (type.name === 'reference') {
    return resolveReferenceInput(type)
  }
  if (type.name === 'image') {
    return MyCustomImageInput
  }
  if (type.name === 'customPatchHandlingExampleType') {
    return InputWithCustomState
  }
  if (type.name === 'file') {
    return MyCustomFileInput
  }
  if (type.name === 'slug') {
    return MyCustomSlugInput
  }
  return type.inputComponent || undefined // signal to use default
}

function resolveValidationComponent() {
  return MyCustomValidationList
}

export default class Main extends React.Component {
  state = {
    inspect: false,
    value: restore(PERSISTKEY),
    saved: false
  }

  patchChannel = FormBuilder.createPatchChannel()

  componentDidUpdate(prevProps, prevState) {
    if (prevState.inspect !== this.state.inspect) {
      document.body.style.overflow = this.state.inspect === 'fullscreen' ? 'hidden' : ''
    }
  }

  handleChange = event => {
    this.receivePatches(event.patches)
  }

  receivePatches(patches) {
    const nextValue = patches.reduce((prev, patch) => applyPatch(prev, patch), this.state.value)
    this.patchChannel.receivePatches({patches, snapshot: nextValue})

    this.setState({
      value: nextValue,
      saved: false
    })
  }

  cmdSave(event) {
    save(PERSISTKEY, this.state.value)
    this.setState({saved: true})
  }

  cmdLog(event) {
    console.log(this.state.value) // eslint-disable-line no-console
  }

  cmdClear(event) {
    this.receivePatches([unset()])
  }

  cmdRevert(event) {
    this.receivePatches([set(restore(PERSISTKEY))])
  }

  cmdInspectLive(event) {
    this.setState({inspect: event.currentTarget.checked ? 'docked' : false})
  }

  handleDispatchCommand = event => {
    const command = event.currentTarget.getAttribute('data-cmd')
    const methodName = `cmd${command}`
    if (typeof this[methodName] !== 'function') {
      throw new Error(`Invalid command: ${JSON.stringify(command)}`)
    }
    this[methodName](event)
  }

  CommandButton = props => {
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
        <this.CommandButton command="Log">console.log value</this.CommandButton>{' '}
        <label>
          <input
            data-cmd="InspectLive"
            checked={inspect}
            type="checkbox"
            onChange={this.handleDispatchCommand}
          />{' '}
          Live inspection
        </label>
      </div>
    )
  }

  renderInspect() {
    const {value, inspect} = this.state
    return (
      <div className={styles[inspect === 'docked' ? 'inspectPane' : 'inspectPaneFullScreen']}>
        <button
          className={styles.closeInspectPaneButton}
          onClick={() => this.setState({inspect: false})}
        >
          x
        </button>
        {inspect === 'docked' && (
          <button
            className={styles.fullscreenInspectPaneButton}
            onClick={() => this.setState({inspect: 'fullscreen'})}
          >
            ↑
          </button>
        )}
        {inspect === 'fullscreen' && (
          <button
            className={styles.dockedInspectPaneButton}
            onClick={() => this.setState({inspect: 'docked'})}
          >
            ↓
          </button>
        )}
        <div
          className={
            styles[inspect === 'docked' ? 'inspectPaneInner' : 'inspectPaneInnerFullScreen']
          }
        >
          <Inspector inspect={value} />
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
            <FormBuilder
              patchChannel={this.patchChannel}
              resolveInputComponent={resolveInputComponent}
              resolvePreviewComponent={resolvePreviewComponent}
              value={value}
              type={schemaType}
              validation={validation}
              onChange={this.handleChange}
            />
          </form>
        </div>
        {inspect && this.renderInspect()}
      </div>
    )
  }
}
