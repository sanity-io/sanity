import React from 'react'
import Demo from '../components/Demo'
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
  DefaultField
} from '../../../src'

Debug.disable('*')

// whyDidYouUpdate(React)

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

const VALID_SCHEMA_NAMES = Object.keys(schemas)

const [schemaName, typeName] = document.location.pathname.split('/').filter(Boolean)

function renderSchemas() {
  return (
    <ul className={styles.nav}>
      {VALID_SCHEMA_NAMES.map(name => (
        <li key={name} className={name === typeName ? styles.navItemSelected : styles.navItem}>
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
        <li className={name === typeName ? styles.navItemSelected : styles.navItem} key={name}>
          <a className={styles.navItemLink} href={`/${schemaName}/${name}`}>{name}</a>
        </li>
      ))}
    </ul>
  )
}

const compiledSchema = schemaName
  && VALID_SCHEMA_NAMES.includes(schemaName)
  && compileSchema(schemas[schemaName])

function renderDemo(compiledSchema) {
  const schemaFieldComponents = Object.assign({}, inputComponents)
  Object.keys(compiledSchema.types).forEach(typeName => {
    const typeDef = compiledSchema.types[typeName]
    if (!inputComponents[typeName] && inputComponents[typeDef.type]) {
      schemaFieldComponents[typeName] = inputComponents[typeDef.type]
    }
  })

  function resolveInputComponent(field) {
    if (field.type === 'latlon') {
      return MyCustomLatLonInput
    }
    if (field.type === 'text' && field.format === 'html') {
      return schemaFieldComponents.richtext
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

  if (!(typeName in compiledSchema.types)) {
    return <p>Invalid type "{typeName}". Please select another one from the menu above</p>
  }

  return (
    <Demo
      schema={compiledSchema}
      type={compiledSchema.types[typeName]}
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
          {compiledSchema && (
            <span>
              {typeName ? 'Types:' : 'Select type:'}
              {renderTypes(compiledSchema)}
            </span>
          )}
        </header>
        {typeName && compiledSchema && renderDemo(compiledSchema)}
        {schemaName && !compiledSchema && (
          <p>No such schema {schemaName}. Please select another one from the menu above</p>
        )}
      </div>
    )
  }
}

export default Main
