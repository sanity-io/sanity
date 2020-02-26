import * as React from 'react'
import FormBuilderContext from '@sanity/form-builder/lib/FormBuilderContext'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import {applyAll} from '@sanity/form-builder/lib/patch/applyPatch'
import * as is from '@sanity/form-builder/lib/utils/is'
import {setLocation} from 'part:@sanity/base/presence'
import DefaultPane from 'part:@sanity/components/panes/default'

import schema from 'part:@sanity/base/schema'
import {StringInput} from './inputs/StringInput'
import {ObjectInput} from './inputs/ObjectInput'
import usePresence from './usePresence'
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

const MissingInput = () => <div>No input component resolved for type {type.name} :/</div>

const resolveInput = memoize(type => {
  if (is.type('object', type)) {
    return ObjectInput
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
  const type = schema.get('recursiveObjectTest')

  const [value, setValue] = React.useState({_type: type.name})
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

  return (
    <>
      <DefaultPane title="Testing stuff">
        <FormBuilderContext resolveInputComponent={resolveInput}>
          <form onSubmit={preventDefault}>
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
          </form>
        </FormBuilderContext>
      </DefaultPane>
    </>
  )
}
