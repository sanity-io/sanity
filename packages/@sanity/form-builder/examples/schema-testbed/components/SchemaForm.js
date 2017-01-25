import React from 'react'
import styles from './styles/SchemaForm.css'
import Header from './Header'
import Inspector from './Inspector'
import {save, restore} from '../lib/persist'

import sourceSchemas from '../schemas'
import {Schema} from '@sanity/schema'
import {createFormBuilder} from '../../../src'
import {parseParams, preventDefault} from '../lib/utils'

import MyCustomLatLonInput from './custom/MyCustomLatLonInput'
import MyCustomValidationList from './custom/MyCustomValidationList'
import MyCustomImageInput from './custom/MyCustomImageInput'
import MyCustomFileInput from './custom/MyCustomFileInput'
import MyCustomSlugInput from './custom/MyCustomSlugInput'
import MyCustomReferencePreview from './custom/MyCustomReferencePreview'
import BlockEditorSlate from '../../../src/inputs/BlockEditor-slate'
import toGradientPatch from '../../../src/sanity/utils/toGradientPatch'
import resolveReferenceInput from './custom/resolveReferenceInput'
import arrify from 'arrify'
import {arrayToJSONMatchPath, Patcher} from '@sanity/mutator'

const SCHEMA_NAMES = Object.keys(sourceSchemas)
const params = parseParams(document.location.pathname)

const schema = params.schemaName && params.typeName && Schema.compile(sourceSchemas[params.schemaName])

const PERSISTKEY = `form-builder-value-${params.schemaName}-${params.typeName}`

function logPatch(patch) {
  console.info( // eslint-disable-line no-console
    '%c%s%c %s => %o',
    'color:#2097ac',
    patch.type,
    'color:inherit',
    arrayToJSONMatchPath(patch.path),
    patch.value
  )
}
console.log(schema)
const FormBuilder = schema && createFormBuilder({
  schema: schema,
  resolveInputComponent(type) {
    if (type.component) {
      return type.component
    }
    if (type.name === 'latlon') {
      return MyCustomLatLonInput
    }
    // debugger
    // if (type.isTypeOf('array') && type.get('options').editor === 'slate') {
    //   return BlockEditorSlate
    // }
    if (type.name === 'reference') {
      return resolveReferenceInput(type)
    }
    if (type.name === 'image') {
      return MyCustomImageInput
    }
    if (type.name === 'file') {
      return MyCustomFileInput
    }
    if (type.name === 'slug') {
      return MyCustomSlugInput
    }
    return undefined // signal to use default
  },
  resolvePreviewComponent(type) {
    if (type.name === 'reference') {
      return MyCustomReferencePreview
    }
    return undefined // signal to use default
  },
  resolveValidationComponent() {
    return MyCustomValidationList
  }
})

export default class Main extends React.Component {
  state = {
    inspect: false,
    value: FormBuilder.createEmpty(params.typeName),
    saved: false
  }

  handleChange = event => {
    const {patch} = event

    let pendingValue = this.state.value
    arrify(patch).map(logPatch)
    const gpatches = arrify(patch).map(toGradientPatch)
    gpatches.forEach(gpatch => {
      pendingValue = new Patcher(gpatch).applyViaAccessor(pendingValue)
    })

    this.setState({
      value: pendingValue,
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
  handleDispatchCommand = event => {
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
