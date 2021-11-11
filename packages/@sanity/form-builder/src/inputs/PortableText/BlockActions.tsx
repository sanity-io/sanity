import {
  PortableTextEditor,
  PortableTextBlock,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'
import styled from 'styled-components'
import PatchEvent from '../../PatchEvent'
import {createBlockActionPatchFn} from './utils/createBlockActionPatchFn'
import {RenderBlockActions} from './types'

type BlockActionsProps = {
  block: PortableTextBlock
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
}

const Root = styled.div`
  user-select: none;
  display: flex;
`

function isClassComponent(component) {
  return typeof component === 'function' && !!component.prototype?.isReactComponent
}

function isFunctionComponent(component) {
  return typeof component === 'function' && String(component).includes('return React.createElement')
}

export function BlockActions(props: BlockActionsProps) {
  const editor = usePortableTextEditor()
  const {block, onChange, renderBlockActions} = props
  const decoratorValues = useMemo(
    () => PortableTextEditor.getPortableTextFeatures(editor).decorators.map((d) => d.value),
    [editor]
  )

  const blockActions = useMemo(() => {
    if (renderBlockActions) {
      const blockActionProps = {
        block,
        value: PortableTextEditor.getValue(editor),
        set: createBlockActionPatchFn('set', block, onChange, decoratorValues),
        unset: createBlockActionPatchFn('unset', block, onChange, decoratorValues) as () => void,
        insert: createBlockActionPatchFn('insert', block, onChange, decoratorValues),
      }
      // Support returning a class component for renderBlockActions (to keep backward compatability as it was possible before)
      if (isClassComponent(renderBlockActions) || isFunctionComponent(renderBlockActions)) {
        const RenderComponent = renderBlockActions
        return <RenderComponent {...blockActionProps} />
      }
      return renderBlockActions(blockActionProps)
    }
    return undefined
  }, [renderBlockActions, block, editor, onChange, decoratorValues])

  // Take focus away from the editor so dealing with block actions doesn't interfere with the editor focus
  const handleClick = useCallback(() => {
    PortableTextEditor.blur(editor)
  }, [editor])

  // Don't render anything if the renderBlockActions function returns null.
  // Note that if renderBlockComponent is a React class, this will never be the case.
  if (!blockActions) {
    return null
  }

  return (
    <Root contentEditable={false} onKeyDown={handleClick} onMouseDown={handleClick}>
      {blockActions}
    </Root>
  )
}
