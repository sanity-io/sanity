// @flow
import React, {PropTypes} from 'react'
import {Map} from 'immutable'
import PatchEvent, {set, setIfMissing, unset} from '../../../../src/PatchEvent'
import shallowEquals from 'shallow-equals'

// TODO: Continue from here

type Deserialized = Map<string, string>

type Serialized = {
  first: string,
  second: string
}

function deserialize(value : Serialized) : Deserialized {
  if (value === undefined || value === null) {
    return value
  }
  let map = new Map()
  if (value.first !== undefined) {
    map = map.set('first', value.first)
  }
  if (value._type !== undefined) {
    map = map.set('_type', value._type)
  }
  if (value.second !== undefined) {
    map = map.set('second', value.second)
  }
  return map
}

type Patch = {
  type: string,
  path: ['first' | 'second'],
  value: string
}

function applyPatchOnValue(currentValue : Deserialized, patch : Patch) {
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
function applyPatchOnKey(currentValue : Deserialized, patch : Patch) {
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

function applyPatch(currentValue : Deserialized, patch : Patch) : Deserialized {
  return patch.path.length === 0
    ? applyPatchOnValue(currentValue, patch)
    : applyPatchOnKey(currentValue, patch)
}

type Props = {
  value: Serialized,
  type: any,
  onChange: (PatchEvent) => void
}

function isSegmentEqual(segment1, segment2) {
  const segment1Type = typeof segment1
  if (segment1Type !== typeof segment2) {
    return false
  }
  if (segment1Type === 'object') {
    return shallowEquals(segment1, segment2)
  }
  return segment1 === segment2
}

function startsWith(subjectPath, checkPath) {
  if (subjectPath === checkPath) {
    return true
  }
  if (!Array.isArray(subjectPath) || !Array.isArray(checkPath)) {
    return false
  }
  if (subjectPath.length < checkPath.length) {
    return false
  }
  for (let i = 0, len = checkPath.length; i < len; i++) {
    if (!isSegmentEqual(checkPath[i], subjectPath[i])) {
      return false
    }
  }
  return true
}


export default class SpecialDeepField extends React.Component {
  props: Props

  static contextTypes = {
    getValuePath: PropTypes.func,
    formBuilder: PropTypes.any
  }

  state: {
    value: Deserialized
  }

  constructor(props: Props) {
    super()
    this.state = {
      value: deserialize(props.value)
    }
  }

  componentDidMount() {
    this.context.formBuilder.patchChannel.subscribe(patches => {
      const myPath = this.context.getValuePath()
      const filtered = patches
        .filter(patch => startsWith(patch.path, myPath))
        .map(patch => ({...patch, path: patch.path.slice(myPath.length)}))
      filtered.forEach(patch => {
        console.log('PATCH IS FOR ME. YEE', patch)
      })
      this.receivePatches(filtered)
    })
  }

  handleChange = event => {
    const fieldName : string = event.target.name
    const inputValue : string = event.target.value
    this.setField(fieldName, inputValue)
  }

  handleBlur() {

  }

  setField(fieldName : string, inputValue : value) {
    const {onChange, type} = this.props
    onChange(PatchEvent.from(
      setIfMissing({_type: type.name}),
      inputValue === '' ? unset([fieldName]) : set(inputValue, [fieldName])
    ))
  }

  receivePatches(patches : Array<Patch>) {
    this.setState(prevState => ({
      value: patches.reduce(applyPatch, prevState.value)
    }))
  }

  render() {
    const {value} = this.state
    const {type} = this.props
    return (
      <div style={{border: '1px dotted #aaa'}}>
        <h2>{type.title}</h2>
        <h3>this.props.value</h3>
        <pre>{JSON.stringify(this.props.value, null, 2)}</pre>
        <h3>this.state.value</h3>
        <pre>{JSON.stringify(value && value.toJS(), null, 2)}</pre>
        <div>
          first: <input type="text" name="first" value={value ? value.get('first') : ''} onChange={this.handleChange} />
        </div>
        <div>
          second: <input type="text" name="second" value={value ? value.get('second') : ''} onChange={this.handleChange} />
        </div>
      </div>
    )
  }
}
