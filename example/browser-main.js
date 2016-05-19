import 'babel-polyfill'

import domready from 'domready'
import React from 'react'
import ReactDOM from 'react-dom'
import Demo from './components/Demo'
import Debug from 'debug'
import {whyDidYouUpdate} from 'why-did-you-update'
import schemas from './schemas'
import {
  compileSchema,
  fieldInputs
} from '../src'

Debug.disable('*')

whyDidYouUpdate(React)

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

domready(init)

const VALID_SCHEMA_NAMES = Object.keys(schemas)

const [schemaName, typeName] = document.location.pathname.split('/').filter(Boolean)

function init() {

  function renderSchemas() {
    return (
      <ul className="schemas">
        {VALID_SCHEMA_NAMES.map(name => (
          <li key={name} className={name === schemaName && 'selected'}>
            <a href={`/${name}`}>{name}</a>
          </li>
        ))}
      </ul>
    )
  }


  function renderTypes(compiledSchema) {
    const typeNames = Object.keys(compiledSchema.types)

    return (
      <ul className="types">
        {typeNames.map(name => (
          <li className={name === typeName && 'selected'} key={name}>
            <a href={`/${schemaName}/${name}`}>{name}</a>
          </li>
        ))}
      </ul>
    )
  }

  const compiledSchema = schemaName && compileSchema(schemas[schemaName])

  function renderDemo(compiledSchema) {
    Object.keys(compiledSchema.types).forEach(typeName => {
      const typeDef = compiledSchema.types[typeName]
      if (!fieldInputs[typeName] && fieldInputs[typeDef.type]) {
        fieldInputs[typeName] = fieldInputs[typeDef.type]
      }
    })

    function resolveFieldInput(field, type) {
      return fieldInputs[field.type]
    }

    return (
      <Demo
        schema={compiledSchema}
        type={compiledSchema.types[typeName]}
        resolveFieldInput={resolveFieldInput}
      />
    )
  }

  ReactDOM.render((
    <div>
      <header>
        Schemas: {renderSchemas()}
        {compiledSchema && (
          <span>
            {typeName ? 'Types:' : 'Select type:'}
            {renderTypes(compiledSchema)}
          </span>
        )}
      </header>
      {typeName && compiledSchema && renderDemo(compiledSchema)}
    </div>
  ), document.getElementById('main'))
}
