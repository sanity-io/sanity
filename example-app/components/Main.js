/* eslint-disable react/no-multi-comp */
import React from 'react'
import Demo from './Demo'
import styles from './styles/Main.css'
import Debug from 'debug'
import MyCustomLatLonInput from './MyCustomLatLonInput'
import ValidationList from './ValidationList'

// Todo: figure out why it complains so much
// import {whyDidYouUpdate} from 'why-did-you-update'
import schemas from '../schemas'
import {
  compileSchema,
  inputComponents,
  fieldComponents,
  BlockEditor,
  DefaultField
} from '../../src'

Debug.disable('*')

// whyDidYouUpdate(React)

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

const VALID_SCHEMA_NAMES = Object.keys(schemas)
const [SCHEMA_NAME, TYPE_NAME] = document.location.pathname.split('/').filter(Boolean)

function renderSchemas() {
  return (
    <ul className={styles.nav}>
      {VALID_SCHEMA_NAMES.map(name => (
        <li key={name} className={name === TYPE_NAME ? styles.navItemSelected : styles.navItem}>
          <a className={styles.navItemLink} href={`/${name}`}>{name}</a>
        </li>
      ))}
    </ul>
  )
}


function renderTypes(compiledSchema) {
  const typeNames = Object.keys(compiledSchema.types)
  return (
    <ul className={styles.nav}>
      {typeNames.map(name => (
        <li className={name === TYPE_NAME ? styles.navItemSelected : styles.navItem} key={name}>
          <a className={styles.navItemLink} href={`/${SCHEMA_NAME}/${name}`}>{name}</a>
        </li>
      ))}
    </ul>
  )
}

const COMPILED_SCHEMA = SCHEMA_NAME
  && VALID_SCHEMA_NAMES.includes(SCHEMA_NAME)
  && compileSchema(schemas[SCHEMA_NAME])

function renderDemo(compiledSchema) {
  const schemaFieldComponents = Object.assign({}, inputComponents)
  Object.keys(compiledSchema.types).forEach(typeName => {
    const typeDef = compiledSchema.types[typeName]
    if (!inputComponents[typeName] && inputComponents[typeDef.type]) {
      schemaFieldComponents[typeName] = inputComponents[typeDef.type]
    }
  })

  function resolveInputComponent(field, type) {
    if (field.type === 'latlon') {
      return MyCustomLatLonInput
    }
    if (field.type === 'text' && field.format === 'html') {
      return schemaFieldComponents.richtext
    }
    if (field.type === 'array' && field.editor === 'prosemirror') {
      return BlockEditor
    }
    return schemaFieldComponents[field.type]
  }
  function resolveFieldComponent(field, type) {
    if (type.type === 'object') {
      return fieldComponents.object
    }
    return fieldComponents[field.type] || DefaultField
  }

  function resolveValidationComponent() {
    return ValidationList
  }

  if (!(TYPE_NAME in compiledSchema.types)) {
    return <p>Invalid type "{TYPE_NAME}". Please select another one from the menu above</p>
  }

  return (
    <Demo
      schema={compiledSchema}
      type={compiledSchema.types[TYPE_NAME]}
      resolveInputComponent={resolveInputComponent}
      resolveFieldComponent={resolveFieldComponent}
      resolveValidationComponent={resolveValidationComponent}
    />
  )
}

class Main extends React.Component {
  render() {
    return (
      <div>
        <header className={styles.header}>
          Schemas: {renderSchemas()}
          {COMPILED_SCHEMA && (
            <span>
              {TYPE_NAME ? 'Types:' : 'Select type:'}
              {renderTypes(COMPILED_SCHEMA)}
            </span>
          )}
        </header>
        {TYPE_NAME && COMPILED_SCHEMA && renderDemo(COMPILED_SCHEMA)}
        {SCHEMA_NAME && !COMPILED_SCHEMA && (
          <p>No such schema {SCHEMA_NAME}. Please select another one from the menu above</p>
        )}
      </div>
    )
  }
}

export default Main
