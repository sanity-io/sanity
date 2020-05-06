import * as React from 'react'
import FormBuilderContext from '@sanity/form-builder/lib/FormBuilderContext'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import {applyAll} from '@sanity/form-builder/lib/patch/applyPatch'
import * as is from '@sanity/form-builder/lib/utils/is'
import DefaultPane from 'part:@sanity/components/panes/default'

import schema from 'part:@sanity/base/schema'

import {StringInputWithProfiling} from './inputs/StringInputWithProfiling'

import {ObjectInput} from './inputs/ObjectInput'
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

const MissingInput = type => <div>No input component resolved for type {type.name} :/</div>

const resolveInput = memoize(type => {
  if (is.type('object', type)) {
    return ObjectInput
  }
  if (is.type('document', type)) {
    return ObjectInput
  }
  if (is.type('string', type)) {
    return StringInputWithProfiling
  }
  return MissingInput
})

const EMPTY = []
const noop = () => {}
export const FormBuilderPerfTool = props => {
  const type = schema.get('recursiveObjectTest')

  const [value, setValue] = React.useState({_type: type.name})
  const [focusPath, setFocusPath] = React.useState([])

  const onChange = React.useCallback(event => {
    setValue(currentValue => applyAll(currentValue, event.patches))
  }, [])

  const onFocus = React.useCallback(nextFocusPath => {
    setFocusPath(nextFocusPath)
  }, [])

  return (
    <>
      <DefaultPane title="Testing stuff">
        <FormBuilderContext resolveInputComponent={resolveInput}>
          <form onSubmit={preventDefault}>
            <FormBuilderInput
              schema={schema}
              value={value}
              presence={EMPTY}
              level={0}
              type={type}
              onBlur={noop}
              onFocus={onFocus}
              focusPath={EMPTY}
              onChange={onChange}
            />
          </form>
        </FormBuilderContext>
      </DefaultPane>
    </>
  )
}
