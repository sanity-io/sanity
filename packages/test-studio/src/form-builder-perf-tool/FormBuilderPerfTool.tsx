import * as React from 'react'
import FormBuilderContext from '@sanity/form-builder/lib/FormBuilderContext'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import {applyAll} from '@sanity/form-builder/lib/patch/applyPatch'
import * as is from '@sanity/form-builder/lib/utils/is'
import {setLocation} from 'part:@sanity/base/presence'

import schema from 'part:@sanity/base/schema'
import {StringInput} from './inputs/StringInput'
import {ObjectInput} from './inputs/ObjectInput'
import usePresence from './usePresence'
import {ArrayInput} from './inputs/ArrayInput'
import {PositionTracker} from './components/PositionTracker'
import {PositionsOverlay} from './components/PositionsOverlay'
const preventDefault = e => e.preventDefault()

function memoize(fn) {
  const memo = new WeakMap()
  return function memoized(arg) {
    if (!memo.has(arg)) {
      memo.set(arg, fn(arg))
    }
    return memo.get(arg)
  }
}

const MissingInput = ({type}) => <div>No input component resolved for type {type.name} :/</div>

const getKey = (id, typeName) => `___formbuilder_perf_tool_${id}-${typeName}`

const save = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}
const load = key => JSON.parse(window.localStorage.getItem(key) || 'null')

const resolveInput = memoize(type => {
  if (is.type('object', type)) {
    return ObjectInput
  }
  if (is.type('array', type)) {
    return ArrayInput
  }
  if (is.type('document', type)) {
    return ObjectInput
  }
  if (is.type('string', type)) {
    return StringInput
  }
  return MissingInput
})

export const FormBuilderPerfTool = props => {
  const id = 'test'
  const typeName = 'recursiveObjectTest'
  const lsKey = getKey('test', typeName)
  const [value, setValue] = React.useState(load(lsKey) || {_id: id, _type: typeName})
  const [focusPath, setFocusPath] = React.useState([])

  const presence = usePresence({documentId: 'foobar', namespace: 'formBuilder'})
  const onChange = React.useCallback(event => {
    setValue(currentValue => applyAll(currentValue, event.patches))
  }, [])

  const onFocus = React.useCallback(nextFocusPath => {
    setLocation([{documentId: 'foobar', path: nextFocusPath, namespace: 'formBuilder'}])
    setFocusPath(nextFocusPath)
  }, [])

  const presenceInfo = presence.flatMap(entry => {
    const {identity, sessions} = entry
    return sessions.flatMap(sess => {
      return (sess.state || []).map(state => ({identity, path: state.path}))
    })
  })

  const type = schema.get(typeName)

  return (
    <>
      <pre style={{position: 'fixed', left: 0, top: 0, backgroundColor: '#fff'}}>
        {JSON.stringify(focusPath)}
      </pre>
      <button onClick={() => save(lsKey, value)}>Save to localstorage</button>

      <PositionTracker>
        <div style={{position: 'relative', overflow: 'auto'}}>
          <PositionsOverlay />
          <form onSubmit={preventDefault}>
            <FormBuilderContext resolveInputComponent={resolveInput}>
              <FormBuilderInput
                schema={schema}
                value={value}
                presence={presenceInfo}
                level={0}
                type={type}
                onBlur={() => {}}
                onFocus={onFocus}
                focusPath={focusPath}
                onChange={onChange}
              />
            </FormBuilderContext>
          </form>
        </div>
      </PositionTracker>
    </>
  )
}
