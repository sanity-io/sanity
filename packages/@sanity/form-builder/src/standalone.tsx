import React, {forwardRef} from 'react'
import ReactDOM from 'react-dom'
import Schema from '@sanity/schema'
import {SchemaType} from '@sanity/types'
import FormBuilderContext from './FormBuilderContext'
import {FormBuilderInput} from './FormBuilderInput'
import is from './utils/is'
import {ObjectInput} from './inputs/ObjectInput'

const doc = {_id: 'foo', _type: 'test'}

const schema = Schema.compile({
  name: 'lol',
  types: [{name: 'test', type: 'document', fields: [{name: 'name', type: 'string'}]}],
})

function GenericPreview() {
  return <div>Preview…</div>
}

const noop = () => {}

function StringInput(props) {
  return (
    <>
      <h1>{props.type.title}</h1>
      <input type="string" />
    </>
  )
}
function resolveInputComponent(type: SchemaType) {
  if (is('object', type) || is('document', type)) {
    return ObjectInput
  }
  if (is('string', type)) {
    return StringInput
  }
  return () => <div>Missing input component for type {type.name} </div>
}

const patchChannel = FormBuilderContext.createPatchChannel()
function App() {
  return (
    <FormBuilderContext
      schema={schema}
      value={doc}
      resolveInputComponent={resolveInputComponent}
      resolvePreviewComponent={() => GenericPreview}
      patchChannel={patchChannel}
    >
      <FormBuilderInput
        value={document}
        type={schema.get('test')}
        level={0}
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
      />
    </FormBuilderContext>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
