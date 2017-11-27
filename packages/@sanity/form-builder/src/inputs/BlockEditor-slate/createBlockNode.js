import React from 'react'
import FormBuilderBlock from './FormBuilderBlock'
import Subscribe from './util/Subscribe'

export default function createBlockNode(type, {onNodePatch, onFocus, onBlur, focusPath, focusPathChanges}) {
  return function BlockNode(props) {
    return (
      <Subscribe initial={focusPath} updates={focusPathChanges}>
        {_focusPath => (
          <FormBuilderBlock
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
