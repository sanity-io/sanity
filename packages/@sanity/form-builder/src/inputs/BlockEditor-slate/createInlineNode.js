import React from 'react'
import Subscribe from './util/Subscribe'
import FormBuilderInline from './FormBuilderInline'

export default function createBlockNode(type, {onNodePatch, onFocus, onBlur, focusPath, focusPathChanges}) {
  return function BlockNode(props) {
    return (
      <Subscribe initial={focusPath} updates={focusPathChanges}>
        {_focusPath => (
          <FormBuilderInline
            type={type}
            {...props}
            onPatch={onNodePatch}
            onBlur={onBlur}
            onFocus={onFocus}
            focusPath={_focusPath}
          />
        )}
      </Subscribe>
    )
  }
}
