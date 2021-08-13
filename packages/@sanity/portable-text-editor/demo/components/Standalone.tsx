import React, {useState} from 'react'
import {
  PortableTextEditor,
  PortableTextEditable,
  RenderDecoratorFunction,
  EditorSelection,
  EditorChange,
} from '../../src'
import {ValueContainer, EditorContainer} from './containers'
import {applyAll} from '../../src/patch/applyPatch'
import {keyGenerator} from '../keyGenerator'
import {createFromPropsValue} from '../fixtures/values'
import {portableTextType} from '../schema'
import {Toolbar} from './Toolbar'

const HOTKEYS = {
  marks: {
    'mod+b': 'strong',
    'mod+i': 'em',
  },
}

/**
 * A basic standalone editor with hotkeys and value inspection
 */
export const Standalone = () => {
  const [patches, setPatches] = useState([])
  const [value, setValue] = useState(undefined)
  const [selection, setSelection] = useState(null)
  const renderDecorator: RenderDecoratorFunction = (mark, mType, attributes, defaultRender) => {
    switch (mark) {
      case 'strong':
        return <strong>{defaultRender()}</strong>
      case 'em':
        return <em>{defaultRender()}</em>
      default:
        return defaultRender()
    }
  }
  const handleChange = (change: EditorChange): void => {
    switch (change.type) {
      case 'selection':
        setSelection(change.selection)
        break
      case 'undo':
      case 'redo':
        const newValue = applyAll(value || [], change.patches)
        setValue(newValue)
        setPatches(patches.concat(change.patches))
        break
      case 'mutation':
        setPatches(change.patches)
        const appliedValue = applyAll(value, change.patches)
        setValue(appliedValue)
        break
      case 'blur':
      case 'mutation':
      case 'focus':
      case 'patch':
      case 'loading':
      case 'invalidValue':
      case 'value':
      case 'unset':
      case 'ready':
        break
      default:
        throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
    }
  }

  const setValueFromProps = () => {
    const val = createFromPropsValue()
    setValue(val)
    if (val && val[0]) {
      const path = [{_key: val[2]._key}, 'children', {_key: val[2].children[0]._key}]
      const sel: EditorSelection = {
        anchor: {path, offset: 0},
        focus: {path, offset: 0},
      }
      setSelection(sel)
    }
  }

  return (
    <div>
      <h2>Portable Text Editor Standalone Basic Demo</h2>
      <button onClick={() => setValueFromProps()}>Set value from props</button>
      <p>
        <strong>Registered hotkeys:</strong> {JSON.stringify(HOTKEYS)}
      </p>
      <PortableTextEditor
        type={portableTextType}
        onChange={handleChange}
        selection={selection}
        value={value}
        keyGenerator={keyGenerator}
        readOnly={false}
      >
        <Toolbar />
        <EditorContainer>
          <PortableTextEditable
            placeholderText="Type here!"
            hotkeys={HOTKEYS}
            renderDecorator={renderDecorator}
            spellCheck
          ></PortableTextEditable>
        </EditorContainer>
      </PortableTextEditor>
      <h3>Editor value:</h3>
      <ValueContainer>{value ? JSON.stringify(value, null, 2) : 'Not set'}</ValueContainer>
      <h3>Editor patches:</h3>
      <ValueContainer>
        {patches ? JSON.stringify(patches, null, 2) : 'None'}
      </ValueContainer>
    </div>
  )
}
