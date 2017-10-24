// @flow
import React from 'react'
import CodeMirror from './CodeMirror'
import JSON5 from 'json5'
import validateSchema from '@sanity/schema/lib/sanity/validateSchema'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import ShowValidationResult from './components/ShowValidationResult'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/hint/show-hint'
import styles from './styles/SchemaInspector.css'

type State = {
  schema: string
}

const options = {
  lineNumbers: true,
  tabSize: 2,
  // theme: 'material',
  mode: {name: 'javascript', json: true}
}

function parse(schemaDef: string) {
  try {
    return [null, JSON5.parse(schemaDef)]
  } catch (error) {
    return [error]
  }
}

function saveSchema(value) {
  window.localStorage.setItem('schema-playground', value)
}

function loadSchema() {
  return window.localStorage.getItem('schema-playground') || ''
}

export default class SchemaValidatorTool extends React.Component<*, State> {
  state = {
    sourceValue: loadSchema()
  }
  handleFormat = () => {
    this.setState({
      sourceValue: JSON5.stringify(JSON5.parse(this.state.sourceValue), null, 2)
    })
  }

  handleLoadSchema = () => {
    this.setState({sourceValue: JSON5.stringify(schema._source.types, null, 2)})
  }

  handleEditorChange = value => {
    this.setState({sourceValue: value})
    saveSchema(value)
  }

  render() {
    const {sourceValue} = this.state
    const [error, parsed] = (sourceValue || '').trim()
      ? parse(sourceValue)
      : [null, []]
    const validationResult = parsed ? validateSchema(parsed) : null
    return (
      <div style={{paddingLeft: 20}}>
        <h2>Schema inspector</h2>
        <div style={{display: 'flex', width: '100%'}}>
          <div style={{width: '40%'}}>
            <Button onClick={this.handleLoadSchema}>Load studio schema</Button>
            <Button onClick={this.handleFormat}>Format</Button>
            <CodeMirror
              className={styles.codemirror}
              value={sourceValue}
              options={options}
              onChange={this.handleEditorChange}
            />
          </div>
          <div style={{width: '60%', padding: '1em'}}>
            {error && <div>{error.message}</div>}
            {validationResult && (
              <ShowValidationResult
                result={validationResult
                  .getTypeNames()
                  .map(validationResult.get)}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}
