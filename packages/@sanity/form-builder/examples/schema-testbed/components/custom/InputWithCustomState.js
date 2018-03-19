// @flow
import React from 'react'
import {Map} from 'immutable'
import PatchEvent, {set, setIfMissing, unset} from '../../../../src/PatchEvent'
import ValueSync from '../../../../src/utils/ValueSync'

type Deserialized = Map<string, string>

type Serialized = {
  first: string,
  second: string
}

function serialize(value: Deserialized): Serialized {
  return value.toJS()
}

function deserialize(value: Serialized): Deserialized {
  if (value === undefined || value === null) {
    return value
  }
  return Map(value)
}

type Patch = {
  type: string,
  path: ['first' | 'second'],
  value: string
}

function applyPatchOnValue(currentValue: Deserialized, patch: Patch) {
  if (patch.type === 'set') {
    return deserialize(patch.value)
  }
  if (patch.type === 'setIfMissing') {
    return currentValue === undefined ? deserialize(patch.value) : currentValue
  }
  if (patch.type === 'unset') {
    return undefined
  }
  throw new Error(`Unsupported patch type ${patch.type}`)
}
function applyPatchOnKey(currentValue: Deserialized, patch: Patch) {
  const key = patch.path.slice().pop()
  if (patch.type === 'set') {
    return currentValue.set(key, patch.value)
  }
  if (patch.type === 'unset') {
    return currentValue.remove(key)
  }
  if (patch.type === 'setIfMissing') {
    return currentValue.get(key) === undefined ? currentValue.set(key, patch.value) : currentValue
  }
  throw new Error(`Unsupported patch type ${patch.type}`)
}

function applyPatch(currentValue: Deserialized, patch: Patch): Deserialized {
  return patch.path.length === 0
    ? applyPatchOnValue(currentValue, patch)
    : applyPatchOnKey(currentValue, patch)
}

type Props = {
  value: Serialized,
  type: any,
  onChange: PatchEvent => void
}

export default class InputWithCustomState extends React.Component {
  props: Props

  handleChange = event => {
    const fieldName: string = event.target.name
    const inputValue: string = event.target.value
    this.setField(fieldName, inputValue)
  }

  setField(fieldName: string, inputValue: value) {
    const {onChange, type} = this.props
    onChange(
      PatchEvent.from(
        setIfMissing({_type: type.name}),
        inputValue === '' ? unset([fieldName]) : set(inputValue, [fieldName])
      )
    )
  }

  render() {
    const {value: rawValue, type} = this.props
    return (
      <div style={{border: '1px dotted #aaa'}}>
        <h2>{type.title}</h2>
        <h3>Raw value</h3>
        <pre>{JSON.stringify(rawValue, null, 2)}</pre>
        <ValueSync
          value={rawValue}
          serialize={serialize}
          deserialize={deserialize}
          applyPatch={applyPatch}
        >
          {({value}) => (
            <div>
              <h3>Internal value (immutable.js)</h3>
              <pre>{JSON.stringify(value && value.toJS(), null, 2)}</pre>
              <div>
                first:
                <input
                  type="text"
                  name="first"
                  value={(value && value.get('first')) || ''}
                  onChange={this.handleChange}
                />
              </div>
              <div>
                second:
                <input
                  type="text"
                  name="second"
                  value={(value && value.get('second')) || ''}
                  onChange={this.handleChange}
                />
              </div>
            </div>
          )}
        </ValueSync>
      </div>
    )
  }
}
