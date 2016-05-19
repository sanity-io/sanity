import 'babel-polyfill'

import domready from 'domready'
import React from 'react'
import ReactDOM from 'react-dom'
import Demo from './components/Demo'
import Debug from 'debug'
import {whyDidYouUpdate} from 'why-did-you-update'
import schemas from './schemas'
console.log(schemas)
import {
  compileSchema,
  fieldInputs
} from '../src'

Debug.disable('*')

whyDidYouUpdate(React)

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

const [, schemaName, typeName] = document.location.pathname.split('/')

const compiledSchema = compileSchema(schemas[schemaName || 'default'])

Object.keys(compiledSchema.types).forEach(typeName => {
  const typeDef = compiledSchema.types[typeName]
  if (!fieldInputs[typeName] && fieldInputs[typeDef.type]) {
    fieldInputs[typeName] = fieldInputs[typeDef.type]
  }
})

function resolveFieldInput(field, type) {
  console.log(field.type, fieldInputs[field.type].displayName)
  return fieldInputs[field.type]
}

domready(() => {
  ReactDOM.render((
    <Demo
      schema={compiledSchema}
      type={compiledSchema.types[typeName || 'story']}
      resolveFieldInput={resolveFieldInput}
    />
  ), document.getElementById('main'))
})
